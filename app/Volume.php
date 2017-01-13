<?php

namespace Biigle;

use DB;
use App;
use File;
use Cache;
use Exception;
use Carbon\Carbon;
use Ramsey\Uuid\Uuid;
use GuzzleHttp\Client;
use Biigle\Jobs\GenerateThumbnails;
use Biigle\Jobs\CollectImageMetaInfo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use GuzzleHttp\Exception\ServerException;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Foundation\Bus\DispatchesJobs;

/**
 * A volume is a collection of images. Volumes belong to one or many
 * projects.
 */
class Volume extends Model
{
    use DispatchesJobs;

    /**
     * Validation rules for creating a new volume.
     *
     * @var array
     */
    public static $createRules = [
        'name'          => 'required|max:512',
        'media_type_id' => 'required|exists:media_types,id',
        'url'           => 'required',
        'images'        => 'required',
    ];

    /**
     * Validation rules for updating a volume.
     *
     * @var array
     */
    public static $updateRules = [
        'name'          => 'filled|max:512',
        'media_type_id' => 'filled|exists:media_types,id',
        'url'           => 'filled',
    ];

    /**
     * Validation rules for adding new images to a volume.
     *
     * @var array
     */
    public static $addImagesRules = [
        'images' => 'required',
    ];

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'pivot',
        'attrs',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'attrs' => 'array',
    ];

    /**
     * Parses a comma separated list of image filenames to an array.
     *
     * @param string $string
     *
     * @return array
     */
    public static function parseImagesQueryString($string)
    {
        return preg_split('/\s*,\s*/', trim($string), null, PREG_SPLIT_NO_EMPTY);
    }

    /**
     * The user that created the volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function creator()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The media type of this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function mediaType()
    {
        return $this->belongsTo(MediaType::class);
    }

    /**
     * Sets the media type of this volume.
     *
     * @param Biigle\MediaType $mediaType
     * @return void
     */
    public function setMediaType($mediaType)
    {
        $this->mediaType()->associate($mediaType);
    }

    /**
     * Sets the media type of this volume to the media type with the given ID.
     *
     * @param int $id media type ID
     * @return void
     */
    public function setMediaTypeId($id)
    {
        $type = MediaType::find($id);
        if ($type === null) {
            abort(400, 'The media type "'.$id.'" does not exist!');
        }
        $this->setMediaType($type);
    }

    /**
     * The images belonging to this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function images()
    {
        return $this->hasMany(Image::class);
    }

    /**
     * The images belonging to this volume ordered by filename (ascending).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function orderedImages()
    {
        return $this->images()->orderBy('filename', 'asc');
    }

    /**
     * Return a query for all users associated to this volume through projects.
     *
     * @return  \Illuminate\Database\Eloquent\Builder
     */
    public function users()
    {
        return User::whereIn('id', function ($query) {
            $query->select('user_id')
                ->distinct()
                ->from('project_user')
                ->whereIn('project_id', function ($query) {
                    $query->select('project_id')
                        ->from('project_volume')
                        ->where('volume_id', $this->id);
                });
        });
    }

    /**
     * Check if the URL of this volume exists and is readable.
     *
     * @return bool
     * @throws Exception If the validation failed.
     */
    public function validateUrl()
    {
        if ($this->isRemote()) {
            $client = App::make(Client::class);
            try {
                $response = $client->head($this->url);
            } catch (ServerException $e) {
                throw new Exception('The remote volume URL returned an error response. '.$e->getMessage());
            } catch (ClientException $e) {
                // A 400 level error means that something is responding.
                // It may well be that the Volume URL results in a 400 response but a
                // single image works fine so we define this as success.
                return true;
            } catch (RequestException $e) {
                throw new Exception('The remote volume URL does not seem to exist. '.$e->getMessage());
            }
        } else {
            if (!File::exists($this->url)) {
                throw new Exception('The volume URL does not exist.');
            }

            if (!File::isReadable($this->url)) {
                throw new Exception('The volume URL is not readable. Please check the access permissions.');
            }
        }

        return true;
    }

    /**
     * Check if an array of image filenames is valid.
     *
     * A valid array is not empty, contains no duplicates and has only images with JPG,
     * PNG or GIF file endings.
     *
     * @param array $filenames
     * @return bool
     * @throws Exception If the validation failed.
     */
    public function validateImages($filenames)
    {
        if (empty($filenames)) {
            throw new Exception('No images were supplied.');
        }

        if (count($filenames) !== count(array_unique($filenames))) {
            throw new Exception('A volume must not have the same image twice.');
        }

        foreach ($filenames as $filename) {
            if (preg_match('/\.(jpe?g|png|gif)$/i', $filename) !== 1) {
                throw new Exception('Only JPG, PNG or GIF image formats are supported.');
            }
        }

        return true;
    }

    /**
     * Creates the image objects to be associated with this volume.
     *
     * Make sure the image filenames are valid.
     *
     * @param array $filenames image filenames at the location of the volume URL
     *
     * @throws QueryException If there was an error creating the images (e.g. if there were
     * duplicate filenames).
     * @throws \Ramsey\Uuid\Exception\UnsatisfiedDependencyException If the UUID generator cannot be executed for some reason.
     *
     * @return bool
     */
    public function createImages($filenames)
    {
        $images = [];
        foreach ($filenames as $filename) {
            $images[] = [
                'filename' => $filename,
                'volume_id' => $this->id,
                'uuid' => Uuid::uuid4(),
            ];
        }

        return Image::insert($images);
    }

    /**
     * Perform actions when new images were added to the volume.
     *
     * @param  array  $only IDs of images to restrict the actions to.
     */
    public function handleNewImages($only = [])
    {
        $this->generateThumbnails($only);
        $this->collectMetaInfo($only);
    }

    /**
     * The project(s), this volume belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class);
    }

    /**
     * The annotation sessions of this volume.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function annotationSessions()
    {
        return $this->hasMany(AnnotationSession::class)->with('users');
    }

    /**
     * The active annotation sessions of this volume (if any).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function activeAnnotationSession()
    {
        $now = Carbon::now();

        return $this->hasOne(AnnotationSession::class)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>', $now)
            ->limit(1);
    }

    /**
     * Returns the active annotation session of this volume for the given user.
     *
     * An annotation session may be active for a volume but it is only also active for
     * a user, if the user belongs to the set of restricted users of the annotation
     * session.
     *
     * @param User $user
     * @return AnnotationSession
     */
    public function getActiveAnnotationSession(User $user)
    {
        return $this->activeAnnotationSession()
            ->whereExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('annotation_session_user')
                    ->where('annotation_session_user.user_id', $user->id)
                    ->whereRaw('annotation_session_user.annotation_session_id = annotation_sessions.id');
            })->first();
    }

    /**
     * Check if the given annotation session is in conflict with existing ones.
     *
     * A conflict exists if the active time period of two sessions overlaps.
     *
     * @param AnnotationSession $session The annotation session to check
     *
     * @return bool
     */
    public function hasConflictingAnnotationSession(AnnotationSession $session)
    {
        return $this->annotationSessions()
            ->when(!is_null($session->id), function ($query) use ($session) {
                return $query->where('id', '!=', $session->id);
            })
            ->where(function ($query) use ($session) {
                $query->where(function ($query) use ($session) {
                    $query->where('starts_at', '<=', $session->starts_at)
                        ->where('ends_at', '>', $session->starts_at);
                });
                $query->orWhere(function ($query) use ($session) {
                    // ends_at is exclusive so it may equal starts_at of another session
                    $query->where('starts_at', '<', $session->ends_at)
                        ->where('ends_at', '>=', $session->ends_at);
                });
            })
            ->exists();
    }

    /**
     * Check if the images of this volume come from a remote URL.
     *
     * @return bool
     */
    public function isRemote()
    {
        // Cache this for a single request because it may be called lots of times.
        return Cache::store('array')->remember("volume-{$this->id}-is-remote", 1, function () {
            return preg_match('#^https?://#i', $this->url) === 1;
        });
    }

    /**
     * An image that can be used a unique thumbnail for this volume.
     *
     * @return Image
     */
    public function getThumbnailAttribute()
    {
        return Cache::remember("volume-thumbnail-{$this->id}", 60, function () {
            // Choose an image from the middle of the volume because the first and last
            // ones are often of bad quality.
            $index = round($this->images()->count() / 2) - 1;

            return $this->orderedImages()->skip($index)->first();
        });
    }

    /**
     * Check if the volume has some images with GPS coordinates.
     *
     * @return bool
     */
    public function hasGeoInfo()
    {
        return Cache::remember("volume-{$this->id}-has-geo-info", 60, function () {
            return $this->images()->whereNotNull('lng')->whereNotNull('lat')->exists();
        });
    }

    /**
     * Flush the cached information if this volume has images with GPS coordinates.
     */
    public function flushGeoInfoCache()
    {
        Cache::forget("volume-{$this->id}-has-geo-info");
    }

    /**
     * (Re-) generates the thumbnail images for all images belonging to this volume.
     *
     * @param array $only (optional) Array of image IDs to restrict the (re-)generation
     * of thumbnails to.
     */
    protected function generateThumbnails($only = [])
    {
        $this->dispatch(new GenerateThumbnails($this, $only));
    }

    /**
     * (Re-) collects image meta information for images of this volume.
     *
     * @param array $only (optional) Array of image IDs to restrict the action to.
     */
    protected function collectMetaInfo($only = [])
    {
        $this->dispatch(new CollectImageMetaInfo($this, $only));
    }
}