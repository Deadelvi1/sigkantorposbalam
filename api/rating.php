<?php
/**
 * Endpoint untuk mengelola rating kantor pos
 * Submit rating dan get rating statistics
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getRating();
        break;
    
    case 'POST':
        submitRating();
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
 * GET - Ambil rating statistics untuk kantor pos
 */
function getRating() {
    $fid = isset($_GET['fid']) ? intval($_GET['fid']) : null;
    
    if (!$fid) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'fid diperlukan'
        ]);
        exit;
    }
    
    $ratingFile = __DIR__ . '/../data/rating/' . $fid . '.json';
    
    if (!file_exists($ratingFile)) {
        echo json_encode([
            'success' => true,
            'data' => [
                'average' => 0,
                'count' => 0,
                'distribution' => ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0]
            ]
        ]);
        exit;
    }
    
    $ratingData = json_decode(file_get_contents($ratingFile), true);
    
    if (!$ratingData) {
        echo json_encode([
            'success' => true,
            'data' => [
                'average' => 0,
                'count' => 0,
                'distribution' => ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0]
            ]
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $ratingData
    ]);
}

/**
 * POST - Submit rating baru
 */
function submitRating() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['fid']) || !isset($input['rating'])) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'fid dan rating diperlukan'
        ]);
        exit;
    }
    
    $fid = intval($input['fid']);
    $rating = intval($input['rating']);
    
    if ($rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'Rating harus antara 1 sampai 5'
        ]);
        exit;
    }
    
    $userId = isset($input['user_id']) ? htmlspecialchars($input['user_id'], ENT_QUOTES, 'UTF-8') : 'anonymous_' . md5($_SERVER['REMOTE_ADDR'] . time());
    
    $ratingFile = __DIR__ . '/../data/rating/' . $fid . '.json';
    $ratingDir = dirname($ratingFile);
    
    if (!is_dir($ratingDir)) {
        mkdir($ratingDir, 0755, true);
    }
    
    $ratingData = [
        'average' => 0,
        'count' => 0,
        'distribution' => ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0],
        'ratings' => []
    ];
    
    if (file_exists($ratingFile)) {
        $existing = json_decode(file_get_contents($ratingFile), true);
        if ($existing) {
            $ratingData = $existing;
        }
    }
    
    $existingRatingIndex = null;
    foreach ($ratingData['ratings'] as $index => $r) {
        if (isset($r['user_id']) && $r['user_id'] === $userId) {
            $existingRatingIndex = $index;
            break;
        }
    }
    
    $newRating = [
        'id' => uniqid(),
        'rating' => $rating,
        'tanggal' => date('Y-m-d H:i:s'),
        'user_id' => $userId
    ];
    
    if ($existingRatingIndex !== null) {
        $oldRating = $ratingData['ratings'][$existingRatingIndex]['rating'];
        $ratingData['ratings'][$existingRatingIndex] = $newRating;
        $ratingData['distribution'][(string)$oldRating]--;
        $ratingData['distribution'][(string)$rating]++;
    } else {
        $ratingData['ratings'][] = $newRating;
        $ratingData['count']++;
        $ratingData['distribution'][(string)$rating]++;
    }
    
    $total = 0;
    foreach ($ratingData['ratings'] as $r) {
        $total += $r['rating'];
    }
    $ratingData['average'] = $ratingData['count'] > 0 ? round($total / $ratingData['count'], 2) : 0;
    
    if (file_put_contents($ratingFile, json_encode($ratingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Gagal menyimpan rating'
        ]);
        exit;
    }
    
    updateGeoJSONRating($fid, $ratingData);
    
    echo json_encode([
        'success' => true,
        'message' => 'Rating berhasil disimpan',
        'data' => $ratingData
    ]);
}

/**
 * Helper function untuk update rating di GeoJSON
 */
function updateGeoJSONRating($fid, $ratingData) {
    $geojsonFile = __DIR__ . '/../data/poinkantorpos.geojson';
    
    if (!file_exists($geojsonFile)) {
        return;
    }
    
    $geojsonData = file_get_contents($geojsonFile);
    $data = json_decode($geojsonData, true);
    
    if (!$data || !isset($data['features'])) {
        return;
    }
    
    foreach ($data['features'] as &$feature) {
        if (isset($feature['properties']['fid']) && $feature['properties']['fid'] == $fid) {
            $feature['properties']['rating'] = [
                'average' => $ratingData['average'],
                'count' => $ratingData['count']
            ];
            
            break;
        }
    }
    
    file_put_contents($geojsonFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

