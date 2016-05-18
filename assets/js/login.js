// usersso js

$(document).ready(function () {
  var $createAccountForm = $('#form-create-an-account'),
      $navTabItems = $('.nav-tabs > li'),
      $createAccountEle = $('#create-an-account'),
      $signInEle = $('#sign-in');

  $createAccountForm.formValidation({
      framework: 'bootstrap',
      excluded: ':disabled, :hidden, :not(:visible)',
      icon: {
        valid: 'glyphicon glyphicon-ok',
        invalid: 'glyphicon glyphicon-remove',
        validating: 'glyphicon glyphicon-refresh'
      }
  }).submit(function(event) {
    var userName = $(this).find('input[name="username"]');
    userName.val(userName.val().toLowerCase());
  });

  $navTabItems.removeClass('active');
  if ($.url(location.href).segment(-1) === 'login') {
    $createAccountEle.hide();
    $signInEle.show();
    $navTabItems.last().addClass('active');
  } else {
    $createAccountEle.show();
    $signInEle.hide();
    $navTabItems.first().addClass('active');
  }

});
