// Store search view

(function ($) {
  $(document).ready(function () {
    var $brandFilters = $('#brand-filters'),
    $toggleBrandsEle = $('<li class="show-toggle"><a class="blue-link" id="toggleMoreBrands" href="javascript:;">+ Show More</a></li>'),
    $productList = $('#productList'),
    $formReset = $('#productListReset'),
    $resultLimitDropdowns = $('.searchLimitResults'),
    $searchSortBy = $('#search-sortBy'),
    $searchLowPrice = $('#searchLowPrice'),
    $searchHighPrice = $('#searchHighPrice'),
    $searchTextInput = $('#searchProdText'),
    $priceFilterBtn = $('#priceFilterBtn'),
    $paginationEle = $('#productListPager'),
    $formSearch = $('#searchProdForm'),
    getUrl = window.location.pathname,
    baseUrl = window.location.protocol + '//' + window.location.host,
    numPerPageInt = 15,
    isViewAll = true,
    isToggled = false,
    intialRun = true,
    searchParamState = {
      'page': 1,
      'priceLow': null,
      'priceHigh': null,
      'searchText': null,
      'numPerPage': 15,
      'sortBy': null,
      'cat': null,
      'brand': [
      ]
    };

    var filterToggle = function () {
      var controls = '.selectedBrand, .show-toggle';
      var toggleText = isToggled ? '+ Show More': '- Show Less';
      var $selectedBrands = $brandFilters.find('.selectedBrand');
      var $toggleBrands = $('#toggleMoreBrands');
      if (intialRun) {
        //initial stuff
        intialRun = false;
        if ($brandFilters.hasClass('view-all')) {
          $brandFilters.find('li').not(controls).addClass('hide');
        }
      } else {
        if ($brandFilters.hasClass('view-all')) {
          $brandFilters.find('li').not(controls).toggleClass('hide');
          $brandFilters.prepend($selectedBrands);
          isToggled = !isToggled;
          $toggleBrands.text(toggleText);
        }
      }
    };

    var checkBoxUpdate = function (event) {
      if (isViewAll) {
        $(this).parent('li').addClass('selectedBrand');
      }
      updateSearch(event);
    };

    var resetForm = function () {
      $brandFilters.find('input').removeAttr('checked');
      $searchLowPrice.val('');
      $searchHighPrice.val('');
    };

    var clearParam = function (param) {
      if (searchParamState.hasOwnProperty(param)) {
        searchParamState[param] = '';
      }
    };

    var mirrorDropdowns = function(event) {
      $resultLimitDropdowns.val(this.value);
      numPerPageInt = this.value;
      updateSearch(event);
    };

    var textSubmit = function(event) {
      if (event.which === 13) {
        updateSearch(event);
      }
    };

    var initialBrands = function() {
      var brandsInQuery =  $.query.get('brand');
      var brandsToCheck;
      if (brandsInQuery.length) {
        brandsToCheck = brandsInQuery.split('+');
      } else {
        return false;
      }
      if (brandsToCheck.length) {
        for (var i=0; i < brandsToCheck.length; i++) {
          $brandFilters.find('input[value=' + brandsToCheck[i] + ']').prop('checked', true);
        }
      }
    };

    var brandsChecked = function() {
      var checkedInputs = $brandFilters.find('input:checked');
      var brandVals = [];
      if (checkedInputs.length) {
        for (var i=0; i < checkedInputs.length; i++) {
          brandVals.push(checkedInputs[i].value);
          if (searchParamState.brand.indexOf(checkedInputs[i].value) === -1) {
            searchParamState.brand.push(checkedInputs[i].value);
          }
        }
      } else {
        return 'null';
      }
      return brandVals.join('+');
    };

    var paramUpdate = function (searchObj) {
      if (typeof searchObj === 'object') {
        searchParamState.brand = brandsChecked();
        searchParamState = $.extend(searchParamState, searchObj);
        for (var propName in searchParamState) {
          if (searchParamState.hasOwnProperty(propName)) {
            if (searchParamState[propName] === true || searchParamState[propName] === 'null') {
              searchParamState[propName] = '';
            }
          }
        }
        return searchParamState;
      }
    };

    var updateSearch = function (event) {
      if (event) {
        var paramToSet = event.data.param;
        var takeAction = event.data.action;
        var newVal = function() {
          switch(paramToSet) {
            case 'numPerPage' :
              return numPerPageInt;
            case 'sortBy' :
              return $searchSortBy.val();
            case 'brand' :
              return brandsChecked();
            case 'priceLow' :
              return parseFloat($searchLowPrice.val());
            case 'priceHigh' :
              return parseFloat($searchHighPrice.val());
            case 'page' :
              return event.data.value;
            case 'searchText' :
              return $searchTextInput.val();
            case 'category' :
              return event.data.value;
            case 'trigger' :
              return 'trigger';
            default:
              if (event.data.value) {
                return event.data.value;
              }
        }}();

        if ($.query) {
          //for each param in baseSearch, set its corresponding value then set the new
          var searchString;
          if (paramToSet !== 'trigger') {
            var searchObj = $.query.set(paramToSet, newVal).keys;
            var resetPageCond = (paramToSet === 'numPerPage' && !isViewAll || paramToSet === 'searchText' && !isViewAll);
            if (resetPageCond) {
              if (searchObj.hasOwnProperty('page')) {
                searchObj.page = 1;
              }
            }
            searchString = $.param(paramUpdate(searchObj));
          } else {
            searchString = $.param(paramUpdate(searchParamState));
          }

          if (takeAction === true && searchString !== false) {
            if (event.data.path) {
              window.location = baseUrl + '/'+ event.data.path + '?' + searchString;
            } else {
              window.location.search = '?' + searchString;
            }
          }
        } else {
          console.log('Failed to load jQuery.query plugin');
        }
      }
    };

    var bindThem = function () {
      var $brandCheckboxes = $('#brand-filters').find('input');
      var $categoryLinks = $('.category-search');
      var $activeCategories = $('.clear-category');
      var $toggleBrands = $('#toggleMoreBrands');

      $toggleBrands.on('click',  filterToggle);

      $formReset.on('click', resetForm);

      $categoryLinks.on('click', function(event) {
        event.preventDefault();
        updateSearch({
          data: {
            param: 'cat',
            value: $(this).data('cat'),
            action: true,
            path: 'shop/search'
          }
        });
      });

      $activeCategories.on('click', function() {
        clearParam('cat');
        updateSearch({data: {param: 'trigger', action: true, path: 'shop/search'}});
      });

      $brandCheckboxes.on('change', {
        param: 'brand',
        action: true,
        path: 'shop/search'
      }, checkBoxUpdate);

      $searchLowPrice.on('change', {
        param: 'priceLow',
        action: false
      }, updateSearch);

      $searchHighPrice.on('change', {
        param: 'priceHigh',
        action: false
      }, updateSearch);

      $resultLimitDropdowns.on('change', {
        param: 'numPerPage',
        action: true
      }, mirrorDropdowns);

      $searchSortBy.on('change', {
        param: 'sortBy',
        action: true
      }, updateSearch);

      $priceFilterBtn.on('click', function() {
        //Send both low and high when price search
        updateSearch({data: {param: 'trigger', action: true, path: 'shop/search'}});
      });

      $searchTextInput.on('keyup', {
        param: 'searchText',
        action: true,
        path: 'shop/search'
      }, textSubmit);

      $formSearch.on('submit', function(){
        return false;
      });
    };

    var paginateResults = function () {
      if ($paginationEle.length) {
        var currPage = parseInt($paginationEle.attr('data-current-page'));
        var totalPages = parseInt($paginationEle.attr('data-last-page'));
        var perPage = parseInt($paginationEle.attr('data-results-per-page'));
        $paginationEle.pagination({
          pages: totalPages,
          currentPage: currPage,
          itemsOnPage: perPage,
          prevText: 'Prev',
          nextText: 'Next',
          cssStyle: 'light-theme',
          onPageClick(page, event) {
            event.preventDefault();
            if (isViewAll) {
              var newUrl = getUrl.replace(/\b\page.*/g, 'page/' + page);
              window.location = baseUrl + newUrl;
            } else {
              updateSearch({data: {param: 'page', value: page, action: true}});
            }
          }
        });
/*         $paginationEle.pagination({ */
          // total_pages: totalPages,
          // current_page: currPage,
          // next: 'Next &gt;',
          // prev: '&lt; Prev',
          // display_max: 5,
          // callback: function(event, page) {
            // event.preventDefault();
            // if (isViewAll) {
              // var newUrl = getUrl.replace(/\b\page.*/g, 'page/' + page);
              // window.location = baseUrl + newUrl;
            // } else {
              // updateSearch({data: {param: 'page', value: page, action: true}});
            // }
          // }
        /* }); */
      }
    };

    var init = function () {
      if ($productList.length) {
        isViewAll = $productList.data('viewAll');
      }
      if ($brandFilters.hasClass('view-all')) {
        $brandFilters.append($toggleBrandsEle);
      }
      if (!isViewAll) {
        initialBrands();
      }
      filterToggle();
      paginateResults();
      bindThem();
      $('#responsive-menu-button').sidr({
        name: 'sidr-main',
        source: '#side-filters',
        renaming: false
      });
      $('body').swipe( {
        //Single swipe handler for left swipes
        swipeLeft: function () {
            $.sidr('close', 'sidr-main');
        },
        swipeRight: function () {
            $.sidr('open', 'sidr-main');
        },
        //Default is 75px, set to 0 for demo so any distance triggers swipe
        threshold: 45
      });
    };

    init();

  });

} (jQuery));

