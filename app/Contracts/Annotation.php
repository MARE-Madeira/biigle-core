<?php

namespace Biigle\Contracts;

use Biigle\Shape;

/**
 * An annotation model.
 */
interface Annotation
{
    /**
     * Get the points array of the annotation.
     *
     * @return array
     */
    public function getPoints(): array;

    /**
     * Get the shape of an annotation.
     *
     * @return Shape
     */
    public function getShape(): Shape;
}
