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
      getUrl = window.location,
      baseUrl = getUrl.protocol + '//' + getUrl.host + '/' + getUrl.pathname.split('/')[0],
      selectedOptions = {
        'brand' : 'all-brands',
        'country' : 'all-countries'
      },
      endpoints = {
        //All brands, all countries
        'all' : '/webservices/store/storelist',
        //List all brands available in specific country: /store/manufacturer/names/<country> NOTE: only returns brands for brandDrop, no HTML for results
        'countryHasBrands' : '/webservices/store/manufacturer/names/',
        //List of countries for a selected brand: store/countrieslist/<manufacturerId> NOTE: only returns countries for countryDrop, no HTML for results
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
        var refPathname = window.location.pathname.split('/'),
            historyPop = ('state' in window.history && window.history.state !== null),
            allStoresState = refPathname.length <= 4 && (refPathname[3] === undefined || !refPathname[3].length);
        showLoading(true);
        selectListener();
        window.onpopstate = historyAction;

        //Refresh or back button vs. initial load
        if (!historyPop) {
          //Handle urls, all-stores base path
          if (!allStoresState) {
            //For brand or country direct URLs (not back button), stores/all-stores/brands/<brandUniqueName>
            if (refPathname.length === 4) {
                //stores/all-stores/US
                selectedOptions.country = refPathname[3];
                $countryDrop.val(selectedOptions.country).trigger('change');
              } else if (refPathname.length === 5) {
                if (refPathname[3] !== 'brands') {
                  //stores/all-stores/Gucci-Watches/CA
                  selectedOptions.brand = refPathname[3];
                  selectedOptions.country = refPathname[4];
                  $brandDrop.val(selectedOptions.brand).trigger('change');
                  $countryDrop.val(selectedOptions.country).trigger('change');
                } else {
                  //stores/all-stores/Gucci-Watches
                  selectedOptions.brand = refPathname[4];
                  $brandDrop.val(selectedOptions.brand).trigger('change');
                }
            }
          }
          getRetailerData(endpoints.all);
          historyUpdate(selectedOptions);
        } else {
          historyAction(window.history.state);
        }
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
              selectedOptions.brand = selValue;
              if (selectedOptions.country === 'all-countries') {
                if (selectedOptions.brand === 'all-brands') {
                  getRetailerData(endpoints.all, 'allDropdown');
                } else {
                  getRetailerData(endpoints.brandAll+selectedOptions.brand, 'brandDropdown');
                }
              } else {
                // Update Country dropdown for specific value (e.g. 'Gucci-Watches' for countries available)
                if (selectedOptions.brand !== 'all-brands') {
                  getRetailerData(endpoints.brandCountryDetail+selectedOptions.brand+'/'+selectedOptions.country);
                  getRetailerData(endpoints.brandHasCountries+selectedOptions.brand, 'brandDropdown', false);
                } else {
                  ////getRetailerData(endpoints.countryHasBrands+selectedOptions.country, 'countryDropdown', false);
                  getRetailerData(endpoints.countryAll+selectedOptions.country, 'brandDropdown');
                }
              }
              break;

            case 'country':
              selectedOptions.country = selValue;
              if (selectedOptions.brand === 'all-brands') {
                if (selectedOptions.country === 'all-countries') {
                  getRetailerData(endpoints.all, 'allDropdown');
                } else {
                  // Update Brand dropdown for specific value (e.g. 'US' for brands in US)
                  getRetailerData(endpoints.countryAll+selectedOptions.country, 'countryDropdown');
                }
              } else {
                // Update Brand dropdown for specific value
                if (selectedOptions.country !== 'all-countries') {
                  //Specific country and brand
                  getRetailerData(endpoints.brandCountryDetail+selectedOptions.brand+'/'+selectedOptions.country);
                  getRetailerData(endpoints.countryHasBrands+selectedOptions.country, 'countryDropdown', false);
                } else {
                  //All countries selected, brand selected
                  getRetailerData(endpoints.brandAll+selectedOptions.brand, 'brandDropdown');
                }
              }
              break;

          }
        }

        //Only update url and browser history if user selects option
        if (e.type !== 'historyActionEvt') {
          historyUpdate(selectedOptions);
        }

      };

      //Getter: GET request to endpoint with serial number, call results fn if successful
      var getRetailerData = function(webserviceUrl, isDropdown, renderBool) {
        if (webserviceUrl && typeof webserviceUrl === 'string') {
          if (!isLoading) {
            showLoading(true);
          }
          $.get(webserviceUrl)
          .done(function(data) {
            if (isDropdown === 'brandDropdown' || isDropdown === 'countryDropdown' || isDropdown === 'allDropdown') {
              //If false renderBool, endpoint only updates dropdowns (e.g. countryHasBrands, brandHasCountries)
              if (renderBool === undefined || renderBool === true) {
                outputResults(data);
              }
              if (isDropdown === 'allDropdown') {
                updateDropdowns(data, 'brandDropdown');
                updateDropdowns(data, 'countryDropdown');
              } else {
                updateDropdowns(data, isDropdown);
              }
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
              var currCountry = $countryDrop.val(),
                  countryOptions = [];
              countryOptions.push($countryDrop.children('option[disabled="disabled"], option[value="all-countries"]'));
              for (var j=0; j < data.length; j++) {
                var countryOptionValue = data[j].country || data[j].countryCode,
                  countryOptionTxt = data[j].countryName,
                  countryOptionSelected = countryOptionValue === currCountry ? 'selected="true"' : '',
                  countryOptionResult = '<option value="' + countryOptionValue + '" ' + countryOptionSelected + '>' + countryOptionTxt + '</option>';
                if (countryOptions.indexOf(countryOptionResult) === -1 && countryOptionValue) {
                  countryOptions.push(countryOptionResult);
                }
              }
              $countryDrop.html(countryOptions);
              break;
            case 'countryDropdown':
              //Update brand dropdown
              var currBrand = $brandDrop.val(),
                  brandOptions = [];
              brandOptions.push($brandDrop.children('option[disabled="disabled"], option[value="all-brands"]'));
              for (var k=0; k < data.length; k++) {
                var brandOptionValue = data[k].brandUniqueName,
                    brandOptionTxt = data[k].brandName,
                    brandOptionSelected = brandOptionValue === currBrand ? 'selected="true"' : '',
                    brandOptionResult = '<option value="' + brandOptionValue + '" ' + brandOptionSelected + '>' + brandOptionTxt + '</option>';
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
          var brandStatesSort = {};
          //Reset (important when dropdowns change)
          brandIndex = [];
          $retailerListContainer.empty();

          //Begin Transparency.js template decorators, massages data for templates
          var logoDecorator = function(params) {
            var $logoEle = $(params.element);
            var imgBasePath = $logoEle.attr('data-imgpath');
            if (this.brandLogo !== null) {
                return '<a href="' + baseUrl + 'shop/brand/' + this.brandUniqueName + '"><img src="' + imgBasePath + this.brandLogo + '" alt="' + this.brandName + '" /></a>';
            } else {
                return '<h2><a href="' + baseUrl + 'shop/brand/' + this.brandUniqueName + '">' + this.brandName + '</a></h2>';
            }
          };

          //Adjust data as classname didn't match field name
          var countryDecorator = function() {
            return this.countryName;
          };

          //Helps when retailers don't have a defined URL
          var retailerDecorator = function() {
            return '<a href="' + baseUrl + 'stores/' + this.locationUniqueName + '">' + this.locationName + '</a>';
          };

          //Stamps on country data attr
          var countrySort = function(params) {
            var $countryContainer = $(params.element);
            $countryContainer.attr('data-country', this.countryName);
            $countryContainer.attr('id', this.brandUniqueName + '_' + this.country);
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
          $retailerListContainer.append(postRenderCleanup($brandListing));
        }

        if (callResult === 'fail') {
          console.log('API failure');
        }

      };

      //Run before outputResults() to clean up and sort display
      var postRenderCleanup = function($listingEle) {
        var $retailConts = $listingEle.find('.retailer-text');

        //Alphabetizes, reprints columns TODO: remove
        $listingEle.find('.retailer-wrap').each(function () {
          var stateList = [];
          var $wrapDiv = $('<div class="col-md-4 retailer-text no-pad" />');
          var maxCols = 3;
          var alphaOrderedStates = function (a, b) {
            return $(a).data('state') > $(b).data('state');
          };
          $(this).find('.retailer-text').each(function () {
            var stateEles =  $(this).find('.state-container');
            stateList.push(stateEles);
            $(this).remove();
          });

          var flatStates = [];
          $(stateList).each(function() {$.merge(flatStates, this);});
          var alphaStateList = flatStates.sort(alphaOrderedStates);
          var numInRow = Math.ceil(alphaStateList.length / maxCols);

          while (alphaStateList.length) {
            var colItems = alphaStateList.splice(0, numInRow);
            var newCol = $wrapDiv.clone().html(colItems);
            if (newCol.length) {
              $(this).append(newCol);
            }
          }

        });

        //Cleanup leading line on results
        $listingEle.find('.store-list').first().removeClass('single-line');

        return $listingEle;
      };

      //Push selection to history state
      var historyUpdate = function(selectionObj) {
        var refPathname = window.location.pathname.split('/'),
            basePath = window.location.origin + '/' + refPathname[1] + '/' + refPathname[2],
            pushUrl;

        if (selectionObj.brand === 'all-brands' && selectionObj.country !== 'all-countries') {
          //Country selected, all brands available
          pushUrl =  basePath + '/' + selectionObj.country;
        } else if (selectionObj.brand !== 'all-brands' && selectionObj.country === 'all-countries') {
          //Brand selected, all countries available
          pushUrl =  basePath + '/brands/' + selectionObj.brand;
        } else if (selectionObj.brand !== 'all-brands' && selectionObj.country !== 'all-countries') {
          //Brand selected, country selected
          pushUrl = basePath + '/' + selectionObj.brand + '/' + selectionObj.country;
        } else {
          pushUrl = basePath;
        }

        if (typeof selectionObj === 'object') {
          var selectionData = JSON.stringify(selectionObj);
          window.history.pushState(selectionData, 'ALL AUTHORIZED RETAILERS', pushUrl);
        }

      };

      //Handle onpopstate event for history actions
      var historyAction = function(e) {
           var selectionRestore = e.state ? JSON.parse(e.state) : JSON.parse(window.history.state);
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

