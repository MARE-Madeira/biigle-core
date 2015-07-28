<?php

use Dias\Image;

class ImageTest extends ModelWithAttributesTest
{
    public static function create($file = 'test-image.jpg', $transect = false)
    {
        $obj = new Image;
        $obj->filename = $file;
        $transect = $transect ? $transect : TransectTest::create('test', base_path().'/tests/files');
        $transect->save();
        $obj->transect()->associate($transect);

        return $obj;
    }

    public function testCreation()
    {
        $obj = self::create();
        $this->assertTrue($obj->save());
    }

    public function testAttributes()
    {
        $image = self::create();
        $image->save();
        $this->assertNotNull($image->filename);
        $this->assertNotNull($image->transect_id);
        $this->assertNotNull($image->thumbPath);
        $this->assertNotNull($image->url);
        $this->assertNull($image->created_at);
        $this->assertNull($image->updated_at);

        $this->assertNotNull(Image::$thumbPath);
    }

    public function testHiddenAttributes()
    {
        $image = self::create();
        $image->save();
        $json = json_decode((string) $image);
        $this->assertObjectNotHasAttribute('filename', $json);
    }

    public function testFilenameRequired()
    {
        $obj = self::create();
        $obj->filename = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->save();
    }

    public function testTransectRequired()
    {
        $obj = self::create();
        $obj->transect()->dissociate();
        $this->setExpectedException('Exception');
        $obj->save();
    }

    public function testTransectOnDeleteSetNull()
    {
        $image = self::create();
        $image->save();
        $image->transect->delete();
        $this->assertNull($image->fresh()->transect);
    }

    public function testFilenameTransectUnique()
    {
        $transect = TransectTest::create();
        $obj = self::create('test', $transect);
        $obj->save();
        $obj = self::create('test', $transect);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $obj->save();
    }

    public function testAnnotations()
    {
        $image = self::create();
        $annotation = AnnotationTest::create($image);
        $annotation->save();
        AnnotationTest::create($image)->save();
        $this->assertEquals(2, $image->annotations()->count());
        $this->assertEquals($annotation->id, $image->annotations()->first()->id);
    }

    public function testProjectIds()
    {
        $image = self::create();
        $image->save();
        $project = ProjectTest::create();
        $project->save();
        $transect = $image->transect;

        $this->assertEmpty($image->projectIds());
        $project->addTransectId($transect->id);
        // clear caching of previous call
        Cache::flush();
        $ids = $image->projectIds();
        $this->assertNotEmpty($ids);
        $this->assertEquals($project->id, $ids[0]);

        $image->transect->delete();
        $this->assertEmpty($image->fresh()->projectIds());
    }

    public function testGetThumb()
    {
        $image = self::create();
        $image->save();
        // remove previously created thumbnail
        File::delete($image->thumbPath);

        // first try to load, then create
        InterventionImage::shouldReceive('make')
            ->twice()
            ->withAnyArgs()
            ->passthru();

        $thumb = $image->getThumb();
        $this->assertNotNull($thumb);
        $this->assertTrue(File::exists($image->thumbPath));

        // now the thumb already exists, so only one call is required
        InterventionImage::shouldReceive('make')
            ->once()
            ->with($image->thumbPath)
            ->passthru();

        $thumb = $image->getThumb();
        $this->assertNotNull($thumb);
    }

    public function testGetFile()
    {
        $image = self::create();
        $image->save();
        InterventionImage::shouldReceive('make')
            ->once()
            ->with($image->url)
            ->passthru();

        $file = $image->getFile();
        $this->assertNotNull($file);

        // error handling when the original file is not readable
        $image->filename = '';

        InterventionImage::shouldReceive('make')
            ->once()
            ->passthru();

        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\NotFoundHttpException');
        $image->getFile();
    }

    public function testRemoveDeletedImages()
    {
        $image = self::create();
        $image->save();
        $image->getThumb();
        $this->assertTrue(File::exists($image->thumbPath));
        $image->transect->delete();
        $this->assertTrue(File::exists($image->thumbPath));
        Artisan::call('remove-deleted-images');
        $this->assertFalse(File::exists($image->thumbPath));
        $this->assertNull($image->fresh());
    }

    public function testGetExif()
    {
        $image = self::create();
        $image->save();
        $exif = $image->getExif();
        $this->assertEquals('image/jpeg', $exif['MimeType']);
    }
}
