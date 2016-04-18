// Store search view

(function ($) {
  $(document).ready(function () {
    var $brandFilters = $('#brand-filters'),
    $toggleBrandsEle = $('<li class="show-toggle"><a class="blue-link" id="toggleMoreBrands" href="javascript:;">+ Show More</a></li>'),
    $selectedBrand = $('.selectedBrand'),
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
    currentParams = '',
    isToggled = false,
    intialRun = true;


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

    var brandsChecked = function() {
      var checkedInputs = $brandFilters.find('input:checked');
      var brandVals = [];
      if (checkedInputs.length) {
        for (var i=0; i < checkedInputs.length; i++) {
          brandVals.push(checkedInputs[i].value);
        }
      } else {
        return 'null';
      }
      return brandVals.join('+');
    };

    var updateSearch = function (event) {
      var paramToSet = event.data.param;
      var takeAction = event.data.action;
      var newVal = function() {
        switch(paramToSet) {
          case 'numPerPage' :
            return numPerPageInt;
          case 'sortBy' :
            return $searchSortBy.val();
          case 'priceLow' :
            return $searchLowPrice.val();
          case 'priceHigh' :
            return $searchHighPrice.val();
          case 'brand' :
            return brandsChecked();
      }}();
      if ($.query) {
        //for each param in baseSearch, set its corresponding value then set the new
        var searchString = $.param($.query.set(paramToSet, newVal).keys);
        if (paramToSet === 'numPerPage') {
          var currPage = $.query.get('page');
          //Reset pagination to page 1 since its shifted
          searchString = searchString.replace(currPage, 1);
        }
        if (takeAction === true) {
          if (event.data.path) {
            window.location = baseUrl + '/'+ event.data.path + '?' + searchString;
          } else {
            window.location.search = '?' + searchString;
          }
        }
      } else {
        console.log('Failed to load jQuery.query plugin');
      }
    };

    var bindThem = function () {
      var $brandCheckboxes = $('#brand-filters').find('input');
      var $toggleBrands = $('#toggleMoreBrands');

      $toggleBrands.on('click',  filterToggle);

      $formReset.on('click', resetForm);

      $brandCheckboxes.find('input').on('change', {
        param: 'brand',
        action: false,
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

      $priceFilterBtn.on('click', function(event) {
        //Send both low and high when price search
        updateSearch({data: {param: 'priceLow', action: false}});
        updateSearch({data: {param: 'priceHigh', action: true, path: 'shop/search'}});
      });

      $searchTextInput.on('keyup', {
        param: 'searchText',
        action: true,
        path: 'shop/search'
      }, textSubmit);

      $formSearch.on('submit', function(e){
        return false;
      });
    };

    var paginateResults = function () {
      if ($paginationEle.length) {
        var currPage = parseInt($paginationEle.attr('current-page'));
        var lastPage = parseInt($paginationEle.attr('last-page'));
        var visPages = 7;

        $paginationEle.twbsPagination({
          initiateStartPageClick: false,
          paginationClass: 'productList',
          activeClass: 'current',
          prev: 'Prev',
          first: false,
          last: false,
          startPage: currPage,
          totalPages: lastPage,
          visiblePages: visPages,
          onPageClick: function (event, page) {
            if (isViewAll) {
              var newUrl = getUrl.replace(/\b\page.*/g, 'page/' + page);
              window.location = baseUrl + newUrl;
            } else {
              var updatePageSearch = $.param($.query.set('page', page).keys);
              window.location.search = '?' + updatePageSearch;
            }
          }
        });
      }
    };

    var init = function () {
      if ($productList.length) {
        isViewAll = $productList.data('viewAll');
        currentParams = $productList.data('search');
      }
      if ($brandFilters.hasClass('view-all')) {
        $brandFilters.append($toggleBrandsEle);
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

