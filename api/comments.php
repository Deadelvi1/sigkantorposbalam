<?php
/**
 * Endpoint untuk mengelola komentar kantor pos
 * CRUD komentar dengan optional rating
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$commentsDir = __DIR__ . '/../data/comments';
if (!is_dir($commentsDir)) {
    mkdir($commentsDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getComments();
        break;
    
    case 'POST':
        createComment();
        break;
    
    case 'PUT':
        updateComment();
        break;
    
    case 'DELETE':
        deleteComment();
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
 * GET - Ambil komentar untuk kantor pos
 */
function getComments() {
    global $commentsDir;
    
    $fid = isset($_GET['fid']) ? intval($_GET['fid']) : null;
    
    if (!$fid) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'fid diperlukan'
        ]);
        exit;
    }
    
    $commentFile = $commentsDir . '/' . $fid . '.json';
    
    if (!file_exists($commentFile)) {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }
    
    $comments = json_decode(file_get_contents($commentFile), true);
    
    if (is_array($comments)) {
        usort($comments, function($a, $b) {
            return strtotime($b['tanggal']) - strtotime($a['tanggal']);
        });
    }
    
    echo json_encode([
        'success' => true,
        'data' => $comments ?: []
    ]);
}

/**
 * POST - Buat komentar baru
 */
function createComment() {
    global $commentsDir;
    
    $fid = isset($_POST['fid']) ? intval($_POST['fid']) : null;
    $nama = isset($_POST['nama']) ? htmlspecialchars($_POST['nama'], ENT_QUOTES, 'UTF-8') : '';
    $komentar = isset($_POST['komentar']) ? htmlspecialchars($_POST['komentar'], ENT_QUOTES, 'UTF-8') : '';
    $rating = isset($_POST['rating']) ? intval($_POST['rating']) : null;
    
    if (!$fid || !$nama || !$komentar) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'fid, nama, dan komentar diperlukan'
        ]);
        exit;
    }
    
    if ($rating !== null && ($rating < 1 || $rating > 5)) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'Rating harus antara 1 sampai 5'
        ]);
        exit;
    }
    
    $commentFile = $commentsDir . '/' . $fid . '.json';
    
    $comments = [];
    if (file_exists($commentFile)) {
        $comments = json_decode(file_get_contents($commentFile), true) ?: [];
    }
    
    $commentId = generateCommentId($comments);
    $newComment = [
        'id' => $commentId,
        'nama' => $nama,
        'komentar' => $komentar,
        'rating' => $rating,
        'tanggal' => date('Y-m-d H:i:s')
    ];
    
    $comments[] = $newComment;
    
    if (file_put_contents($commentFile, json_encode($comments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Gagal menyimpan komentar'
        ]);
        exit;
    }
    
    updateGeoJSONStats($fid, 'comments');
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Komentar berhasil ditambahkan',
        'data' => $newComment
    ]);
}

/**
 * PUT - Update komentar
 */
function updateComment() {
    global $commentsDir;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['fid']) || !isset($input['commentId'])) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'fid dan commentId diperlukan'
        ]);
        exit;
    }
    
    $fid = intval($input['fid']);
    $commentId = intval($input['commentId']);
    $commentFile = $commentsDir . '/' . $fid . '.json';
    
    if (!file_exists($commentFile)) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Komentar tidak ditemukan'
        ]);
        exit;
    }
    
    $comments = json_decode(file_get_contents($commentFile), true) ?: [];
    $found = false;
    
    foreach ($comments as &$comment) {
        if ($comment['id'] == $commentId) {
            if (isset($input['komentar'])) {
                $comment['komentar'] = htmlspecialchars($input['komentar'], ENT_QUOTES, 'UTF-8');
            }
            if (isset($input['rating'])) {
                $rating = intval($input['rating']);
                if ($rating >= 1 && $rating <= 5) {
                    $comment['rating'] = $rating;
                }
            }
            $comment['updated'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Komentar tidak ditemukan'
        ]);
        exit;
    }
    
    if (file_put_contents($commentFile, json_encode($comments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Gagal mengupdate komentar'
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Komentar berhasil diupdate'
    ]);
}

/**
 * DELETE - Hapus komentar
 */
function deleteComment() {
    global $commentsDir;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['fid']) || !isset($input['commentId'])) {
        http_response_code(400);
        echo json_encode([
            'error' => true,
            'message' => 'fid dan commentId diperlukan'
        ]);
        exit;
    }
    
    $fid = intval($input['fid']);
    $commentId = intval($input['commentId']);
    $commentFile = $commentsDir . '/' . $fid . '.json';
    
    if (!file_exists($commentFile)) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Komentar tidak ditemukan'
        ]);
        exit;
    }
    
    $comments = json_decode(file_get_contents($commentFile), true) ?: [];
    $newComments = [];
    $found = false;
    $commentToDelete = null;
    
    foreach ($comments as $comment) {
        if ($comment['id'] == $commentId) {
            $found = true;
            $commentToDelete = $comment;
            continue;
        }
        $newComments[] = $comment;
    }
    
    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'error' => true,
            'message' => 'Komentar tidak ditemukan'
        ]);
        exit;
    }
    
    if (file_put_contents($commentFile, json_encode($newComments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'Gagal menghapus komentar'
        ]);
        exit;
    }
    
    updateGeoJSONStats($fid, 'comments');
    
    echo json_encode([
        'success' => true,
        'message' => 'Komentar berhasil dihapus'
    ]);
}

/**
 * Helper function untuk generate comment ID
 */
function generateCommentId($comments) {
    if (empty($comments)) {
        return 1;
    }
    $maxId = 0;
    foreach ($comments as $comment) {
        if (isset($comment['id']) && $comment['id'] > $maxId) {
            $maxId = $comment['id'];
        }
    }
    return $maxId + 1;
}

/**
 * Helper function untuk update stats di GeoJSON
 */
function updateGeoJSONStats($fid, $type) {
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
            if ($type === 'comments') {
                if (!isset($feature['properties']['stats'])) {
                    $feature['properties']['stats'] = [
                        'totalComments' => 0
                    ];
                }
                
                $commentsFile = __DIR__ . '/../data/comments/' . $fid . '.json';
                $comments = [];
                if (file_exists($commentsFile)) {
                    $comments = json_decode(file_get_contents($commentsFile), true) ?: [];
                }
                $feature['properties']['stats']['totalComments'] = count($comments);
            }
            
            break;
        }
    }
    
    file_put_contents($geojsonFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

