<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\CloneVolume;
use Biigle\Http\Requests\UpdateVolume;
use Biigle\Jobs\CloneImagesOrVideos;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Queue;

class VolumeController extends Controller
{


    /**
     * Shows all volumes the user has access to.
     *
     * @param Request $request
     * @return Response
     * @api {get} volumes Get accessible volumes
     * @apiGroup Volumes
     * @apiName IndexVolumes
     * @apiPermission user
     * @apiDescription Only projects in which the user is a member are listed for each
     * volume.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My Volume",
     *       "media_type_id": 1,
     *       "created_at": "2015-02-10 09:45:30",
     *       "updated_at": "2015-02-10 09:45:30",
     *       "projects": [
     *           {
     *               "id": 11,
     *               "name": "Example project",
     *               "description": "This is an example project"
     *           }
     *       ]
     *    }
     * ]
     *
     */
    public function index(Request $request)
    {
        $user = $request->user();

        return Volume::accessibleBy($user)
            ->with(['projects' => function ($query) use ($user) {
                $query->when(!$user->can('sudo'), function ($query) use ($user) {
                    return $query->join('project_user', 'project_user.project_id', '=', 'projects.id')
                        ->where('project_user.user_id', $user->id);
                })
                    ->select('projects.id', 'projects.name', 'projects.description');
            }])
            ->orderByDesc('id')
            ->select('id', 'name', 'created_at', 'updated_at', 'media_type_id')
            ->get();
    }

    /**
     * Displays the specified volume.
     *
     * @param Request $request
     * @param int $id
     * @return Volume
     * @api {get} volumes/:id Get a volume
     * @apiGroup Volumes
     * @apiName ShowVolumes
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "volume 1",
     *    "media_type_id": 3,
     *    "creator_id": 7,
     *    "created_at": "2015-02-20 17:51:03",
     *    "updated_at": "2015-02-20 17:51:03",
     *    "url": "local://images/",
     *    "projects": [
     *        {
     *            "id": 11,
     *            "name": "Example project",
     *            "description": "This is an example project"
     *        }
     *    ]
     * }
     *
     */
    public function show(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);
        $volume->load(['projects' => function ($query) use ($request) {
            $query->join('project_user', 'project_user.project_id', '=', 'projects.id')
                ->where('project_user.user_id', $request->user()->id)
                ->select('projects.id', 'projects.name', 'projects.description');
        }]);

        return $volume;
    }

    /**
     * Updates the attributes of the specified volume.
     *
     * @param UpdateVolume $request
     * @return Response
     * @api {put} volumes/:id Update a volume
     * @apiGroup Volumes
     * @apiName UpdateVolumes
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the volume.
     * @apiParam (Attributes that can be updated) {String} url The base URL of the files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`. Updating the URL will trigger a re-generation of all volume thumbnails.
     * @apiParam (Attributes that can be updated) {String} handle Handle or DOI of the dataset that is represented by the new volume.
     *
     */
    public function update(UpdateVolume $request)
    {
        $volume = $request->volume;
        $volume->name = $request->input('name', $volume->name);
        $volume->url = $request->input('url', $volume->url);
        $volume->handle = $request->input('handle', $volume->handle);

        $isDirty = $volume->isDirty();
        $shouldReread = !$isDirty && $request->user()->can('sudo');
        $newUrl = $volume->isDirty('url');
        $volume->save();

        // Do this *after* saving.
        if ($newUrl || $shouldReread) {
            ProcessNewVolumeFiles::dispatch($volume);
        }

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('saved', $isDirty)
                ->with('reread', $shouldReread);
        }
    }


    /**
     * Clones volume to destination project.
     *
     * @param int $volumeId
     * @param int $destProjectId
     * @param CloneVolume $request
     * @return Response
     * @api {post} volumes/:id/clone-to/:project_id Clones a volume
     * @apiGroup Volumes
     * @apiName CloneVolume
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The volume id.
     * @apiParam {Number} project_id The target project id.
     * @apiParam {string} name volume name of cloned volume.
     * @apiParam (file ids) {Array} only_files ids of files which should be cloned.
     * @apiParam {bool} clone_annotations Switch to clone annotation labels.
     * @apiParam (annotation label ids) {Array} only_annotation_labels ids of annotation labels which should be cloned.
     * @apiParam {bool} clone_file_labels Switch to clone file labels.
     * @apiParam (file label ids) {Array} only_file_labels ids of file labels which should be cloned.
     *
     * @apiSuccessExample {json} Success response:
     * {
     * "name": "Kulas Group",
     * "media_type_id": 3,
     * "creator_id": 5,
     * "url": "test://files",
     * "handle": null,
     * "created_at": "2022-11-25T13:10:12.000000Z",
     * "updated_at": "2022-11-25T13:10:12.000000Z",
     * "id": 4
     * }
     **/
    public function clone($volumeId, $destProjectId, CloneVolume $request)
    {
        return DB::transaction(function () use ($volumeId, $destProjectId, $request) {
            $createSyncLimit = 10000;

            $project = $request->project;
            $volume = $request->volume;
            $copy = $volume->replicate();
            $copy->name = $request->input('name', $volume->name);
            $copy->save();

            $onlyFiles = $request->input('only_files', []);

            $cloneAnnotations = $request->input('clone_annotations', false);
            $onlyAnnotationLabels = $request->input('only_annotation_labels', []);

            $cloneFileLabels = $request->input('clone_file_labels', false);
            $onlyFileLabels = $request->input('only_file_labels', []);

            // If too many files should be created, do this asynchronously in the
            // background. Else the script will run in the 30 s execution timeout.
            $job = new CloneImagesOrVideos($volume, $copy,
                $onlyFiles, $cloneAnnotations, $onlyAnnotationLabels, $cloneFileLabels, $onlyFileLabels);
            if (count($onlyFiles) > $createSyncLimit) {
                Queue::pushOn('high', $job);
                $copy->save();
            } else {
                Queue::connection('sync')->push($job);
            }

            //save ifdo-file if exist
            if ($volume->hasIfdo()) {
                $this->copyIfdoFile($volumeId, $copy->id);
            }

            $project->addVolumeId($copy->id);

            if ($this->isAutomatedRequest()) {
                return $volume;
            }

            return $this->fuzzyRedirect('project', $destProjectId)
                ->with('message', 'The volume was cloned');
        });

    }

    /** Copies ifDo-Files from given volume to volume copy.
    *
    * @param int $volumeId
    * @param int $copyId
    **/
    private function copyIfdoFile($volumeId, $copyId)
    {
        $disk = Storage::disk(config('volumes.ifdo_storage_disk'));
        $iFdoFilename = $volumeId.".yaml";
        $copyIFdoFilename = $copyId.".yaml";
        $disk->copy($iFdoFilename, $copyIFdoFilename);
    }
}
