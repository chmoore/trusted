/*global Throbber */
/*global trustedAssetsURL */
/*global grecaptcha */
/*global captchaSuccess */

// Authenticate serial form js
(function ($) {
  $(document).ready(function() {
    var $authForm = $('#authenticate-form'),
      $verifyAuthBtn = $('#expand-all-show'),
      $serialInput = $authForm.find('[name=serialNum]'),
      $clearSearchBtn = $('#clearSearch'),
      $resultsContainer = $('#expand-all'),
      $itemTemplate = $('div.item-div').remove(),
      $resultMessage = $resultsContainer.find('.result-message'),
      $resultHeight = $resultsContainer.outerHeight(),
      lastSearch = '',
      $captchaContEle = $('.captcha'),
      throbber = Throbber({
        color: 'black',
        padding: 30,
        size: 32,
        fade: 200,
      }).appendTo(document.querySelector('#authenticate-form .form-group'));

      //Helper fn to check storage support
      var sessionStorageAvailable = function() {
        try {
          return 'sessionStorage' in window && window.sessionStorage !== null;
        } catch(e) {
          return false;
        }
      };

      //If passed true, returns search count from sessionStorage
      var checkForCaptcha = function(upCountBool) {
        if (sessionStorageAvailable()) {
          var updatedCount;
          if (typeof sessionStorage.getItem('Trusted.CheckAuth.SearchCount') === 'string') {
            var searchCount = parseInt(sessionStorage.getItem('Trusted.CheckAuth.SearchCount'));
            if (upCountBool) {
              updatedCount = ++searchCount;
              sessionStorage.setItem('Trusted.CheckAuth.SearchCount', updatedCount);
            } else {
              updatedCount = searchCount;
            }
          } else {
            sessionStorage.setItem('Trusted.CheckAuth.SearchCount', 1);
            updatedCount = 1;
          }
          if (!upCountBool) {
            //Return number of searches
            return updatedCount;
          }
        }
      };

      var requireCaptcha = function(savedSerial) {
        var $captchaEle = $('#captchaContainer');
        if ($captchaContEle.hasClass('hide')) {
          $captchaContEle.removeClass('hide');
        }
        populateResults({}, 'show-captcha');
        if (!$captchaContEle.find('.warning-text').length) {
          $resultMessage.clone().prependTo($captchaContEle);
        }
        $resultMessage.removeClass('warning-text').html('');
        //$authForm.formValidation('resetForm', true);
        $.getScript('https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit', function() {
          window.onloadCallback = function () {
            grecaptcha.render('captchaContainer', {
              'sitekey' : $captchaEle.attr('data-captchaKey'),
              'callback' : captchaSuccess,
              'tabindex' : 3
            });
            $captchaEle.parents('.captcha').removeClass('hide');
          };
        });
        window.captchaSuccess = function() {
          //Remove reCatpcha
          $captchaEle.html('').parents('.captcha').addClass('hide');
          if (sessionStorageAvailable()) {
            sessionStorage.removeItem('Trusted.CheckAuth.SearchCount');
          }
          $('.captcha').find('.result-message').remove();
          verifySerial(savedSerial);
        };
      };

      //Check if field has been emptied, clear results
      var serialUpdate = function() {
        var serialNumber = $serialInput.val();
        if (!serialNumber.length) {
          clearSearch();
        }
      };

      //If we have a valid serial, run getData fn
      var verifySerial = function(serialNum) {
        if (serialNum.length) {
            if ($authForm.find('.form-group').hasClass('has-success')) {
              $authForm.formValidation('resetField', 'serialNum');
            }
            getData(serialNum);
        }
      };

      //Clear out the search results
      var clearSearch = function() {
          showResults(false);
          $authForm.formValidation('resetField', 'serialNum');
          $serialInput.val('').focus();
          lastSearch = '';
          if (!$captchaContEle.hasClass('hide')) {
            $captchaContEle.addClass('hide');
          }
      };

      //Reset search form
      var resetSearch = function() {
        $resultMessage.removeClass('open empty-results').html('');
        $resultsContainer.find('.item-list').empty();
      };

      //For each result print with simple template
      var populateResults = function(data, message) {
        var $itemList = $('<div></div>'),
            serialValue = $serialInput.val(),
            multipleResultsMsg = 'Multiple matching eTitles found for the provided serial number. Select the appropriate product below.',
            emptyResultsMsg = 'Unfortunately, the serial number you entered was not returned. Please try again and ensure you have entered the serial number correctly. <br />If you would like to request eTitle ownership for this product, please use the <a href="/request-an-etitle">eTitle Request</a> feature. <br /><br />Questions? <a href="/contact-us">Contact Us</a>',
            failureMsg = 'We&#39;re sorry, something went wrong. Please try that again <br /><br />Need help? <a href="/contact-us">Contact Us</a>',
            captchaMsg = 'In order to continue using our Check Authenticity feature, please confirm you&#39;re human.',
            item;

        if (message === 'clear') {
          showResults(false);
          return false;
        }

        resetSearch();

        if (message === 'multiple') {
          $resultMessage
            .addClass('multiple-results warning-text')
            .html(multipleResultsMsg);
        } else if (message === 'empty') {
          $resultMessage
            .addClass('empty-results warning-text')
            .html(emptyResultsMsg);
            showResults(true);
            return false;
        } else if (message === 'show-captcha') {
          $resultMessage
            .addClass('empty-results warning-text')
            .html(captchaMsg);
            showResults(true);
            return false;
        } else if (message === 'fail') {
          $resultMessage
            .addClass('failed-request warning-text')
            .html(failureMsg);
            showResults(true);
            return false;
        }

        //Cloning from DOM ele th:fragment="itemTemplate"
        $.each(data, function(index, item) {
          var $itemDiv = $itemTemplate.clone(),
              $imgTag = $itemDiv.find('div.item-image img'),
              $itemHeading = $itemDiv.find('div.item-name h5'),
              $itemMake = $itemDiv.find('div.item-make span'),
              $itemID = $itemDiv.find('div.item-id span'),
              $itemStatus = $itemDiv.find('div.item-status span'),
              $itemLink = $itemDiv.find('div.item-view-btn a');
          $imgTag.attr('src', item.image1Url);
          $itemHeading.text(item.title);
          $itemMake.text(item.make);
          $itemID.text(item.itemCode);
          $itemStatus.text(item.etitleStatus);
          $itemLink.attr('href', item.url);
          $itemList.append($itemDiv);
        });

        $resultsContainer.find('.item-list').empty().append($itemList.unwrap());

        if (message !== 'clear') {
          showResults(true);
        }

      };

      var showResults = function(bool) {
        if (typeof bool === 'boolean' && bool === true) {
          //@TODO: IE9 and below don't have these transition end events?
          $resultsContainer.addClass('open').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
            $resultHeight = $resultsContainer.outerHeight();
          });
        } else {
          //Set the height from when it was open so we can animate back down
          $resultsContainer.attr('style', 'max-height:' + $resultHeight + 'px');
          setTimeout(function() {
            $resultsContainer.removeAttr('style').removeClass('open');
          }, 20);
        }
      };

      //GET request to endpoint with serial number, call results fn if successful
      var getData = function(serialNumber) {
        lastSearch = serialNumber;
        throbber.start();
        //authenticity/search/
        $.get('/webservices/authenticity/search?serialno=' + encodeURIComponent(serialNumber))
          .done(function(data) {
            throbber.stop();
            //Set for first search, otherwise increment
            checkForCaptcha(true);
            if (data.length === 0) {
              populateResults([], 'empty');
            } else if (data.length > 1) {
              populateResults(data, 'multiple');
            } else {
              populateResults(data);
            }
          })
          .fail(function(xhr) {
            //@TODO: Work out retries and a timeout
            throbber.stop();
            populateResults([], 'fail');
          });
      };

      //Bind various input events to verifyAuth fn's
      $serialInput.on({
        'keyup': function(evt) {
          serialUpdate();
        },
        'blur': function(evt) {
          serialUpdate();
        },
        'keypress': function(evt) {
          if (evt.which === 13) {
            var serialNumber = $serialInput.val();
            if (lastSearch !== serialNumber) {
              verifySerial(serialNumber);
            }
            return false;
          }
        }
      });

      //Bind fn.clearSearch to link
      $clearSearchBtn.on('click', function(evt) {
        clearSearch();
      });

      //Initialize form validation
      $authForm.formValidation({
        icon: {
          valid: 'glyphicon glyphicon-ok',
          invalid: 'glyphicon glyphicon-remove',
          validating: 'glyphicon glyphicon-refresh'
        },
        live: 'enabled',
        trigger: 'keyup',
        submitButtons: 'button[type="submit"]'
      }).on('success.form.fv', function(evt) {
        var serialNumber = $serialInput.val();
        evt.preventDefault();
        if (lastSearch !== serialNumber) {
          if (checkForCaptcha(false) < 4) {
            verifySerial(serialNumber);
          } else {
            requireCaptcha(serialNumber);
          }
        }
      });

  });
} (jQuery));

