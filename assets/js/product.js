$(document).ready(function(){
  var $viewProdDescrip = $('#viewProdDescrip');
  var $retailModal = $('#retModal');
  var $retailerModalBtn = $('.btn-contact-retailer');
  var $contactIframe = $('#contactRetailerFrame');
  var $retailModalForm = $('#retailermodal');

  $retailModalForm.formValidation({
    framework: 'bootstrap',
    excluded: ':disabled, :hidden, :not(:visible)',
    icon: {
      valid: 'glyphicon glyphicon-ok',
      invalid: 'glyphicon glyphicon-remove',
      validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
      fname: {
        validators: {
          notEmpty: {
            message: 'Your first name is required'
          }
        }
      },
      lname: {
        validators: {
          notEmpty: {
            message: 'Your last name is required'
          }
        }
      },
      email: {
        validators: {
          notEmpty: {
            message: 'Your email address is required'
          },
          regexp: {
            regexp: '^[^@\\s]+@([^@\\s]+\\.)+[^@\\s]+$',
            message: 'The value is not a valid email address'
          }
        }
      },
      message: {
        validators: {
          notEmpty: {
            message: 'Please enter a message for Trusted'
          },
        }
      }
    }
  });

  if (typeof $.fn.elevateZoom === 'function') {
    $('#zoom').elevateZoom({gallery:'gallery_01', cursor: 'pointer', galleryActiveClass: 'active', imageCrossfade: false});
  }

  $('#zoom').ready(function(){
    if($(window).width()>768){
      $.removeData($(this), 'elevateZoom');
      $('.zoomContainer').remove();
      $('img.zoom').removeData('elevateZoom');
      $('.zoomWrapper img.zoom').unwrap();
      $('.zoomContainer').remove();
    }
  });

  $viewProdDescrip.on('click', function(){
    $('#product-spec').trigger('click');
  });

  $retailerModalBtn.on('click', function(){
    var frameUrl = $(this).attr('data-contact-src');
    $retailModal.removeClass('hide').on('shown.bs.modal', function (frameUrl) {
      $(this).find('iframe').attr('src', frameUrl);
    });
    $retailModal.modal({show:true}).removeClass('hide');
  });


});
