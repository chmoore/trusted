/*global Throbber */

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
      throbber = Throbber({
        color: 'black',
        padding: 30,
        size: 32,
        fade: 200,
      }).appendTo(document.querySelector('#authenticate-form .form-group'));

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
            failureMsg = 'We\'re sorry, something went wrong. Please try that again <br /><br />Need help? <a href="/contact-us">Contact Us</a>',
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
              $itemHeading = $itemDiv.find('div.item-name h6'),
              $itemID = $itemDiv.find('div.item-id h6'),
              $itemLink = $itemDiv.find('div.item-view-btn a');
          $imgTag.attr('src', item.image1Url);
          $itemHeading.text(item.title);
          $itemID.text(item.itemCode);
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
        $.get('/webservices/authenticity/search/' + serialNumber)
          .done(function(data) {
            throbber.stop();
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
        /*'change': function(evt) {
          serialUpdate();
        },*/
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
          verifySerial(serialNumber);
        }
      });

  });
} (jQuery));

