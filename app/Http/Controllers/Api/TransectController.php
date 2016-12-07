<?php

namespace Dias\Http\Controllers\Api;

use Exception;
use Dias\Transect;
use Illuminate\Http\Request;

class TransectController extends Controller
{
    /**
     * Displays the specified transect.
     *
     * @api {get} transects/:id Get a transect
     * @apiGroup Transects
     * @apiName ShowTransects
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "transect 1",
     *    "media_type_id": 3,
     *    "creator_id": 7,
     *    "created_at": "2015-02-20 17:51:03",
     *    "updated_at": "2015-02-20 17:51:03",
     *    "url": "/vol/images/"
     * }
     *
     * @param  int  $id
     * @return Transect
     */
    public function show($id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('access', $transect);

        return $transect;
    }

    /**
     * Updates the attributes of the specified transect.
     *
     * @api {put} transects/:id Update a transect
     * @apiGroup Transects
     * @apiName UpdateTransects
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the transect.
     * @apiParam (Attributes that can be updated) {Number} media_type_id The ID of the media type of the transect.
     * @apiParam (Attributes that can be updated) {String} url The base URL ot the image files. Can be a local path like `/vol/transects/1` or a remote path like `https://example.com/transects/1`. Updating the URL will trigger a re-generation of all transect image thumbnails.
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('update', $transect);

        $this->validate($request, Transect::$updateRules);

        if ($request->has('url')) {
            $transect->url = $request->input('url');
            try {
                $transect->validateUrl();
            } catch (Exception $e) {
                return $this->buildFailedValidationResponse($request, [
                    'url' => $e->getMessage(),
                ]);
            }
        }

        $transect->name = $request->input('name', $transect->name);
        $transect->media_type_id = $request->input('media_type_id', $transect->media_type_id);

        $isDirty = $transect->isDirty();
        $newUrl = $transect->isDirty('url');
        $transect->save();

        // do this *after* saving
        if ($newUrl) {
            $transect->handleNewImages();
        }

        if (!static::isAutomatedRequest($request)) {
            if ($request->has('_redirect')) {
                return redirect($request->input('_redirect'))
                    ->with('saved', $isDirty);
            }
            return redirect()->back()
                ->with('saved', $isDirty);
        }
    }
}
