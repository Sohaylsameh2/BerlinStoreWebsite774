<?php

header('Content-Type: application/json');

// Get the raw POST data
$jsonData = file_get_contents('php://input');
// Decode the JSON data
$data = json_decode($jsonData, true);

// Check if data is received correctly
if ($data === null) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

$product = $data['product'] ?? 'غير محدد';
$price = $data['price'] ?? 'غير محدد';
$customerEmail = $data['customerEmail'] ?? 'غير محدد';
$paymentMethod = $data['paymentMethod'] ?? 'غير محدد';
$customerPhone = $data['customerPhone'] ?? 'غير محدد';

// Your Gmail address to receive the orders
$to = 'sameh1234.elgamal@gmail.com'; // **تم التعديل هنا**

$subject = 'طلب جديد من متجر Berlin Store';

$message = "تم استلام طلب جديد! \n\n";
$message .= "تفاصيل الطلب: \n";
$message .= "المنتج: " . $product . "\n";
$message .= "السعر: " . $price . " ج.م\n";
$message .= "طريقة الدفع: " . $paymentMethod . "\n";
$message .= "الإيميل: " . $customerEmail . "\n";
if ($paymentMethod === 'vodafone') {
    $message .= "رقم العميل: " . $customerPhone . "\n";
}

$headers = 'From: noreply@yourdomain.com' . "\r\n" .
    'Reply-To: ' . $customerEmail . "\r\n" .
    'X-Mailer: PHP/' . phpversion();

// Send the email
$mailSent = mail($to, $subject, $message, $headers);

if ($mailSent) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send email']);
}

?>