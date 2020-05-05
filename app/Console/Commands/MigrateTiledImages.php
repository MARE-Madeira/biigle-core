<?php

namespace Biigle\Console\Commands;

use Queue;
use Biigle\Image;
use Biigle\Volume;
use Illuminate\Console\Command;
use Biigle\Jobs\MigrateTiledImage;

class MigrateTiledImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate-tiled-images
        {in : Storage disk that holds the tiled image ZIP archives}
        {--dry-run : Don\'t submit queued jobs to migrate the images}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Submit queued jobs to unpack zipped tiled images from one storage disk to another';

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $disk = $this->argument('in');

        $query = Image::where('tiled', true);
        $bar = $this->output->createProgressBar($query->count());

        $query->eachById(function ($image) use ($dryRun, $bar, $disk) {
            if (!$dryRun) {
                Queue::push(new MigrateTiledImages($image, $disk));
            }
            $bar->advance();
        });

        $bar->finish();
        $this->line('');
    }
}
