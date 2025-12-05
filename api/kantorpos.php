<?php
/**
 * Endpoint untuk mengambil data GeoJSON Kantor Pos
 * Mengembalikan data dari file GeoJSON
 * Mendukung GET untuk read dan POST untuk create/update/delete
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$adminPassword = 'akuanaksehattubuhkukuat666';

$geojsonFile = __DIR__ . '/../data/poinkantorpos.geojson';
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getKantorPos($geojsonFile);
        break;
    
    case 'POST':
        createKantorPos($geojsonFile);
        break;
    
    case 'PUT':
        updateKantorPos($geojsonFile);
        break;
    
    case 'DELETE':
        deleteKantorPos($geojsonFile);
        break;
    
    default:
        http_response_code(405);
        echo json_encode([
            'error' => true,
            'message' => 'Method not allowed'
        ]);
        break;
}

/**
 * GET - Mengembalikan semua data kantor pos
 */
function getKantorPos($geojsonFile) {
    header('Content-Type: application/geo+json; charset=utf-8');
    
    if (!file_exists($geojsonFile)) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'File GeoJSON tidak ditemukan'
        ]);
        exit;
    }
    
    $geojsonData = file_get_contents($geojsonFile);
    $json = json_decode($geojsonData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Error parsing GeoJSON: ' . json_last_error_msg()
        ]);
        exit;
    }
    
    echo $geojsonData;
}

/**
 * POST - Menambah data kantor pos baru
 */
function createKantorPos($geojsonFile) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'Data tidak boleh kosong'
        ]);
        exit;
    }

    if (!validateAdminPassword($input)) {
        exit;
    }
    
    if (!isset($input['nama']) || !isset($input['lokasi']) || !isset($input['coordinates'])) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'Data tidak lengkap. Diperlukan: nama, lokasi, coordinates [lng, lat]'
        ]);
        exit;
    }
    
    $geojsonData = file_get_contents($geojsonFile);
    $data = json_decode($geojsonData, true);
    
    if (!$data || !isset($data['features'])) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Error membaca data GeoJSON'
        ]);
        exit;
    }
    
    $maxId = 0;
    foreach ($data['features'] as $feature) {
        if (isset($feature['properties']['fid']) && $feature['properties']['fid'] > $maxId) {
            $maxId = $feature['properties']['fid'];
        }
    }
    
    $newId = $maxId + 1;
    $newFeature = [
        'type' => 'Feature',
        'properties' => [
            'fid' => $newId,
            'nama' => htmlspecialchars($input['nama'], ENT_QUOTES, 'UTF-8'),
            'lokasi' => htmlspecialchars($input['lokasi'], ENT_QUOTES, 'UTF-8'),
            'id' => $newId
        ],
        'geometry' => [
            'type' => 'Point',
            'coordinates' => [
                floatval($input['coordinates'][0]),
                floatval($input['coordinates'][1])
            ]
        ]
    ];
    
    $data['features'][] = $newFeature;
    $result = file_put_contents($geojsonFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Gagal menyimpan data'
        ]);
        exit;
    }
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Data berhasil ditambahkan',
        'data' => $newFeature
    ]);
}

/**
 * PUT - Mengupdate data kantor pos
 */
function updateKantorPos($geojsonFile) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'Data tidak boleh kosong'
        ]);
        exit;
    }

    if (!validateAdminPassword($input)) {
        exit;
    }

    if (!isset($input['fid'])) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'ID (fid) diperlukan untuk update'
        ]);
        exit;
    }
    
    $geojsonData = file_get_contents($geojsonFile);
    $data = json_decode($geojsonData, true);
    
    if (!$data || !isset($data['features'])) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Error membaca data GeoJSON'
        ]);
        exit;
    }
    
    $found = false;
    foreach ($data['features'] as &$feature) {
        if (isset($feature['properties']['fid']) && $feature['properties']['fid'] == $input['fid']) {
            if (isset($input['nama'])) {
                $feature['properties']['nama'] = htmlspecialchars($input['nama'], ENT_QUOTES, 'UTF-8');
            }
            if (isset($input['lokasi'])) {
                $feature['properties']['lokasi'] = htmlspecialchars($input['lokasi'], ENT_QUOTES, 'UTF-8');
            }
            if (isset($input['coordinates'])) {
                $feature['geometry']['coordinates'] = [
                    floatval($input['coordinates'][0]),
                    floatval($input['coordinates'][1])
                ];
            }
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Data tidak ditemukan'
        ]);
        exit;
    }
    
    $result = file_put_contents($geojsonFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Gagal menyimpan data'
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Data berhasil diupdate',
        'data' => $feature
    ]);
}

/**
 * DELETE - Menghapus data kantor pos
 */
function deleteKantorPos($geojsonFile) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'Data tidak boleh kosong'
        ]);
        exit;
    }

    if (!validateAdminPassword($input)) {
        exit;
    }

    if (!isset($input['fid'])) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'ID (fid) diperlukan untuk delete'
        ]);
        exit;
    }
    
    $geojsonData = file_get_contents($geojsonFile);
    $data = json_decode($geojsonData, true);
    
    if (!$data || !isset($data['features'])) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Error membaca data GeoJSON'
        ]);
        exit;
    }
    
    $found = false;
    $newFeatures = [];
    foreach ($data['features'] as $feature) {
        if (isset($feature['properties']['fid']) && $feature['properties']['fid'] == $input['fid']) {
            $found = true;
            continue;
        }
        $newFeatures[] = $feature;
    }
    
    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Data tidak ditemukan'
        ]);
        exit;
    }
    
    $data['features'] = $newFeatures;
    
    $result = file_put_contents($geojsonFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Gagal menyimpan data'
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Data berhasil dihapus'
    ]);
}

function validateAdminPassword(&$input) {
    $password = $input['password'] ?? null;
    unset($input['password']);

    if ($password === null) {
        http_response_code(401);
        echo json_encode([
            'error' => true,
            'message' => 'Password diperlukan untuk melakukan perubahan data'
        ]);
        return false;
    }

    global $adminPassword;

    if ($password !== $adminPassword) {
        http_response_code(401);
        echo json_encode([
            'error' => true,
            'message' => 'Password salah'
        ]);
        return false;
    }

    return true;
}

