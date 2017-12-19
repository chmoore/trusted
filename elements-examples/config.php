<?php
require_once('vendor/autoload.php');

$stripe = array(
  "secret_key"      => "sk_test_SdtUGfK8RPidCEc0AKMUID6k",
  "publishable_key" => "pk_test_x7uftfLyZZnNwe9ci6k1hylo"
);

\Stripe\Stripe::setApiKey($stripe['secret_key']);
?>