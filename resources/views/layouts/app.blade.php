<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <title>@yield('title')</title>

    <link href="{{ asset('assets/styles/main.css') }}" rel="stylesheet">
    @stack('styles')
</head>
<body>
@if($user)
    @include('partials.navbar')
@endif
    @include('partials.messages')
    @yield('content')

    @if (app()->environment('local'))
        <script src="{{ asset('assets/scripts/vue.js') }}"></script>
        <script src="{{ asset('assets/scripts/vue-resource.js') }}"></script>
    @else
        <script src="{{ asset('assets/scripts/vue.min.js') }}"></script>
        <script src="{{ asset('assets/scripts/vue-resource.min.js') }}"></script>
    @endif

    <script type="text/javascript">
        Vue.http.options.root = '{{url('/')}}';
        Vue.http.headers.common['X-CSRF-TOKEN'] = '{{csrf_token()}}';
    </script>

    <script src="{{ asset('assets/scripts/angular.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/angular-resource.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/angular-animate.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/ui-bootstrap-tpls.min.js') }}"></script>
    <script src="{{ asset('assets/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.api').constant('URL', '{{ url('/') }}');
    </script>
    @stack('scripts')
</body>
</html>