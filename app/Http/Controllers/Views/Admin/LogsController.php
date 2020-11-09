<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Controller;
use Biigle\Logging\LogManager;
use Carbon\Carbon;
use File;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;

class LogsController extends Controller
{
    /**
     * Shows the available logfiles.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        if (!config('biigle.admin_logs')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $manager = new LogManager;

        if ($manager->isFile()) {
            $logs = $manager->getLogFilenames();
        } elseif ($manager->isRedis()) {
            $perPage = 10;
            $messages = $manager->getRedisLogMessages();
            $total = count($messages);
            $paginator = new LengthAwarePaginator([], $total, $perPage);
            $paginator->setPath(LengthAwarePaginator::resolveCurrentPath());

            $messages = collect($messages)
                ->reverse()
                ->skip(($paginator->currentPage() - 1) * $perPage)
                ->take($perPage)
                ->map(function ($message) {
                    $message = json_decode($message, true);
                    $message['date'] = $message['datetime']['date'];

                    return $message;
                });

            $paginator->setCollection($messages);

            return view('admin.logs.index-redis', compact('paginator'));
        } else {
            $logs = [];
        }


        return view('admin.logs.index', compact('logs'));
    }

    /**
     * Shows a specific logfile.
     *
     * @return \Illuminate\Http\Response
     */
    public function show($file)
    {
        if (!config('biigle.admin_logs')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $manager = new LogManager;

        if (!$manager->isFile() || !in_array($file, $manager->getLogFilenames())) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return view('admin.logs.show', [
            'file' => $file,
            'content' => $manager->getLogFileContent($file),
        ]);
    }
}
