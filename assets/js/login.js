// usersso js

$(document).ready(function () {
  var $createAccountForm = $('#form-create-an-account'),
      $signInForm = $('#signInForm'),
      $forgotPassForm = $('#form-forgot-password'),
      $navTabItems = $('.nav-tabs > li'),
      $createAccountEle = $('#create-an-account'),
      $signInEle = $('#sign-in');

  $signInForm.formValidation({
      framework: 'bootstrap',
      excluded: ':disabled, :hidden, :not(:visible)',
      icon: {
        valid: 'glyphicon glyphicon-ok',
        invalid: 'glyphicon glyphicon-remove',
        validating: 'glyphicon glyphicon-refresh'
      }
  });

  $createAccountForm.formValidation({
      framework: 'bootstrap',
      excluded: ':disabled, :hidden, :not(:visible)',
      icon: {
        valid: 'glyphicon glyphicon-ok',
        invalid: 'glyphicon glyphicon-remove',
        validating: 'glyphicon glyphicon-refresh'
      }
  });

  $forgotPassForm.formValidation({
      framework: 'bootstrap',
      excluded: ':disabled, :hidden, :not(:visible)',
      icon: {
        valid: 'glyphicon glyphicon-ok',
        invalid: 'glyphicon glyphicon-remove',
        validating: 'glyphicon glyphicon-refresh'
      }
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
