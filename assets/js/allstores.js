/*global Transparency */
/*global Throbber */

// Retailers view controller

//Requires Transparency.js for lightweight JS templating
jQuery.fn.render = Transparency.jQueryPlugin;

(function ($) {
  $(document).ready(function() {
    var $brandDrop = $('#select-storelist-brand'),
      $countryDrop = $('#select-storelist-country'),
      $retailerListContainer = $('#retailers-listing'),
      $retailerCont = $('.retailer-container.render').remove(),
      isLoading = true,
      brandIndex = [],
      selectedOption = {
        'brand' : 'all-brands',
        'country' : 'all-countries'
      },
      endpoints = {
        //All brands, all countries
        'all' : '/webservices/store/storelist',
        //List all brands available in specific country: /store/manufacturer/names/<country>
        'countryHasBrands' : '/webservices/store/manufacturer/names/',
        //List of countries for a selected brand: store/countrieslist/<manufacturerId>
        'brandHasCountries' : '/webservices/store/countrieslist/',
        //All brands and listings for this country: store/storelist/<country>
        'countryAll': '/webservices/store/storelist/',
        //All locations for this brand in every countries: store/manufacturer/storelist/<manufacturerId>
        'brandAll' : '/webservices/store/manufacturer/storelist/',
        //Locations for selected brand in selected country: store/storelist/<manufacturerId>/<country>
        'brandCountryDetail' : '/webservices/store/storelist/'
      };

      //Load
      var init = function() {
        showLoading(true);
        selectListener();
        window.onpopstate = historyAction;
        historyUpdate(selectedOption);
        getRetailerData(endpoints.all);
      };

      //Listener: Bind event listeners to dropdowns
      var selectListener = function() {
        $brandDrop.on('change historyActionEvt', filterUpdate);
        $countryDrop.on('change historyActionEvt', filterUpdate);
      };

      //Dropdown change triggered, filter accordingly
      var filterUpdate = function(e) {
        var selValue = e.target.value,
            filterType = e.target.dataset.type;

        if (selValue.length) {
          switch(filterType) {
            case 'brand':
              selectedOption.brand = selValue;
              if (selectedOption.country === 'all-countries') {

                if (selectedOption.brand === 'all-brands') {
                  getRetailerData(endpoints.all, 'brandDropdown');
                } else {
                  getRetailerData(endpoints.brandAll+selectedOption.brand, 'brandDropdown');
                }

              } else {
                // Update Country dropdown for specific value (e.g. 'Gucci-Watches' for countries available)
                if (selectedOption.brand !== 'all-brands') {
                  getRetailerData(endpoints.brandHasCountries+selectedOption.brand, 'brandDropdown');
                } else {
                  ////getRetailerData(endpoints.countryHasBrands+selectedOption.country, 'countryDropdown');
                  getRetailerData(endpoints.countryAll+selectedOption.country, 'countryDropdown');
                }
              }
              break;
            case 'country':
              selectedOption.country = selValue;
              if (selectedOption.brand === 'all-brands') {
                if (selectedOption.country === 'all-countries') {
                  getRetailerData(endpoints.all, 'countryDropdown');
                } else {
                  // Update Brand dropdown for specific value (e.g. 'US' for brands in US)
                  getRetailerData(endpoints.countryAll+selectedOption.country, 'countryDropdown');
                }
              } else {
                // Update Brand dropdown for specific value
                //getRetailerData(endpoints.countryHasBrands+selectedOption.country, 'countryDropdown');
                if (selectedOption.country !== 'all-countries') {
                  //Specific country and brand
                  getRetailerData(endpoints.brandCountryDetail+selectedOption.brand+'/'+selectedOption.country);
                } else {
                  //All countries selected, brand selected
                  getRetailerData(endpoints.brandAll+selectedOption.brand, 'brandDropdown');
                }
              }
              break;
          }
        }

        //Only update browser history if user selects option
        if (e.type !== 'historyActionEvt') {
          historyUpdate(selectedOption);
        }

      };

      //Getter: GET request to endpoint with serial number, call results fn if successful
      var getRetailerData = function(webserviceUrl, isDropdown) {
        if (webserviceUrl && typeof webserviceUrl === 'string') {
          if (!isLoading) {
            showLoading(true);
          }
          $.get(webserviceUrl)
          .done(function(data) {
            if (isDropdown === 'brandDropdown' || isDropdown === 'countryDropdown') {
              outputResults(data);
              updateDropdowns(data, isDropdown);
            } else {
              outputResults(data);
            }
          })
          .fail(function(xhr) {
            showLoading(false);
            if (isDropdown) {
              outputResults([], isDropdown, 'fail');
            } else {
              updateDropdowns([], 'fail');
            }
          });
        }
      };

      //After dropdowns data refreshed, update options
      var updateDropdowns = function(data, dropdownType, callResult) {
        if (data.length && typeof dropdownType === 'string') {
          switch (dropdownType) {
            case 'brandDropdown':
              //Update country dropdown
              var countryOptions = [];
              countryOptions.push($countryDrop.children('option[disabled="disabled"], option[value="all-countries"]'));
              for (var j=0; j < data.length; j++) {
                var countryOptionValue = data[j].country,
                  countryOptionTxt = data[j].countryName,
                  countryOptionResult = '<option value="' + countryOptionValue + '">' + countryOptionTxt + '</option>';
                if (countryOptions.indexOf(countryOptionResult) === -1 && countryOptionValue) {
                  countryOptions.push(countryOptionResult);
                }
              }
              $countryDrop.html(countryOptions);
              break;
            case 'countryDropdown':
              //Update brand dropdown
              var brandOptions = [];
              brandOptions.push($brandDrop.children('option[disabled="disabled"], option[value="all-brands"]'));
              for (var k=0; k < data.length; k++) {
                var brandOptionValue = data[[k]].brandUniqueName,
                    brandOptionTxt = data[[k]].brandName,
                    brandOptionResult = '<option value="' + brandOptionValue + '">' + brandOptionTxt + '</option>';
                if (brandOptions.indexOf(brandOptionResult) === -1 && brandOptionValue) {
                  brandOptions.push(brandOptionResult);
                }
              }
              $brandDrop.html(brandOptions);
              break;
          }
        }
      };

      //Take results of getRetailerData and template up, display
      var outputResults = function(data, callResult) {
        if (data.length && typeof jQuery.fn.render === 'function') {
          //Reset (important when dropdowns change)
          brandIndex = [];
          $retailerListContainer.empty();

          //Begin Transparency.js template decorators, massages data for templates
          var logoDecorator = function(params) {
            var $logoEle = $(params.element);
            var imgBasePath = $logoEle.attr('data-imgpath');
            if (this.brandLogo !== null) {
                return '<img src="' + imgBasePath + this.brandLogo + '" alt="' + this.brandName + '" />';
            } else {
              return '<h2>' + this.brandName + '</h2>';
            }
          };

          //Adjust data as classname didn't match field name
          var countryDecorator = function() {
            return this.countryName;
          };

          //Helps when retailers don't have a defined URL
          var retailerDecorator = function() {
            if (this.url !== null) {
              return '<a href="' + this.url + '">' + this.retailerName + '</a>';
            } else {
              return this.retailerName;
            }
          };

          //Stamps on country data attr
          var countrySort = function(params) {
            var $countryContainer = $(params.element);
            $countryContainer.attr('data-country', this.countryName);
          };

          //Stamps on state data attr
          var statesSort = function(params) {
            var $stateContainer = $(params.element);
            $stateContainer.attr('data-state', this.state);
          };

          //Helps prevent duplicate headings
          var uniqueListing = function(params) {
            var $listingEle = $(params.element);

            //Prevent bad data
            if (this.state === null || this.city === null || this.retailerName === null) {
              $listingEle.remove();
            }

            //Prevent dupes
            if (brandIndex.indexOf(this.brandUniqueName) === -1) {
              brandIndex.push(this.brandUniqueName);
              $listingEle.attr('data-brand', this.brandUniqueName);
            } else {
                var $groupEle = $listingEle.parent().find('div.store-list[data-brand="' + this.brandUniqueName + '"]');
                if ($groupEle.find('.retailer-wrap[data-country="' + this.countryName + '"]').length) {
                  if ($groupEle.children('.retailer-wrap').find('.state-container[data-state="' + this.state + '"]').length) {
                    //Group same state
                    $groupEle.children('.retailer-wrap').find('.state-container[data-state="' + this.state + '"]').append($listingEle.find('.retailer'));
                    $listingEle.remove();
                  } else {
                    //Different state
                    $groupEle.find('.retailer-wrap[data-country="' + this.countryName + '"]').append($listingEle.find('.retailer-text'));
                    $listingEle.remove();
                  }
                } else {
                  //Add country heading to brand
                  $groupEle.append($listingEle.find('.retailer-wrap'));
                  $listingEle.remove();
                }
            }

          };

          //Transparency.js render data directives, see above
          var directives = {
            'logo': {
              html: logoDecorator
            },
            'country': {
              text: countryDecorator
            },
            'retailerName': {
              html: retailerDecorator
            },
            'retailer-wrap' : {
              html: countrySort
            },
            'state-container' : {
              html: statesSort
            },
            'store-list' : {
              html: uniqueListing
            }
          };

          //Clone new listing element, render data with Transparency.js
          var $brandListing = $retailerCont.clone().render(data, directives).removeClass('render hide');
          //Stop the loading spinner
          showLoading(false);
          $brandListing.find('.store-list').first().removeClass('single-line');
          $retailerListContainer.append($brandListing);
          //End Transparency.js templating logic
        }

        if (callResult === 'fail') {
          console.log('API failure');
        }

      };

      //Push selection to history state
      var historyUpdate = function(selectionObj) {
        if (typeof selectionObj === 'object') {
          var selectionData = JSON.stringify(selectionObj);
          window.history.pushState(selectionData, 'ALL AUTHORIZED RETAILERS', window.location.pathname);
        }
      };

      //Handle onpopstate event for history actions
      var historyAction = function(e) {
         var selectionRestore = JSON.parse(e.state);
         $brandDrop.val(selectionRestore.brand).trigger('historyActionEvt');
         $countryDrop.val(selectionRestore.country).trigger('historyActionEvt');
      };

      //Show or hide Throbber loading indicator
      var showLoading = function(bool) {
        isLoading = typeof bool === 'boolean' ? bool : false;
        var $loadingEle = $('.smallThrobberLoading'),
            $resultContainer = $('.retailer-container');
        if (typeof Throbber === 'function' && $loadingEle.length) {
          var throbber = Throbber({
            color: 'black',
            padding: 30,
            size: 32,
            fade: 200,
          });
          if (isLoading) {
            $resultContainer.addClass('hide');
            $loadingEle.removeClass('hide');
            throbber.appendTo($loadingEle[0]).start();
          } else {
            $loadingEle.addClass('hide').find('canvas').remove();
            $resultContainer.removeClass('hide');
          }
        }
      };

      init();

  });

} (jQuery));

