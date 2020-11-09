<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Model;

/**
 * Pivot object for the connection between VolumeFiles and Labels.
 */
abstract class VolumeFileLabel extends Model
{
    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'user_id' => 'int',
        'label_id' => 'int',
    ];

    /**
     * The file, this volume file label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    abstract public function file();

    /**
     * The label, this video label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function label()
    {
        return $this->belongsTo(Label::class);
    }

    /**
     * The user who created this video label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class)
            ->select('id', 'firstname', 'lastname', 'role_id');
    }

    /**
     * Get the file ID attribute.
     *
     * @return int
     */
    abstract public function getFileIdAttribute();
}
