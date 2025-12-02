<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>WebGIS Kantor Pos Bandar Lampung (Premium)</title>

    <script src="https://cdn.tailwindcss.com"></script>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <link rel="stylesheet" href="https://unpkg.com/leaflet.fullscreen@1.6.0/Control.FullScreen.css">
    <script src="https://unpkg.com/leaflet.fullscreen@1.6.0/Control.FullScreen.js"></script>

    <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css">
    <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
</head>

<body class="bg-gray-100">

<nav class="bg-orange-600 text-white py-4 shadow-md fixed w-full z-50">
    <h1 class="text-center text-xl font-bold uppercase">WebGIS Persebaran Kantor Pos Bandar Lampung</h1>
</nav>

<div class="flex pt-24">

    <aside class="w-72 bg-white border-r shadow-lg h-screen p-4 overflow-y-auto">
        <h2 class="text-lg font-bold text-orange-700 mb-3">Daftar Kantor Pos</h2>

        <ul id="sidebarList" class="space-y-2">
        </ul>
    </aside>

    <div id="map" class="flex-1 h-[90vh] mx-3 mt-3 rounded-lg shadow-lg border"></div>

</div>

<script src="assets/js/script.js"></script>

</body>
</html>
