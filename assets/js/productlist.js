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
    $priceFilterBtn = $('#priceFilterBtn'),
    $paginationEle = $('#productListPager'),
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

    var checkBoxUpdate = function () {
      $(this).parent('li').addClass('selectedBrand');
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
      }}();
      if ($.query) {
        var updateSearch = $.param($.query.set(paramToSet, newVal).keys);
        if (paramToSet === 'numPerPage') {
          var currPage = $.query.get('page');
          //Reset pagination to page 1 since its shifted
          updateSearch = updateSearch.replace(currPage, 1);
        }
        if (takeAction === true) {
          window.location.search = '?' + updateSearch;
        }
      } else {
        console.log('Failed to load jQuery.query plugin');
      }
    };

    var bindThem = function () {
      var $brandFilters = $('#brand-filters');
      var $toggleBrands = $('#toggleMoreBrands');
      $brandFilters.find('input').on('change', checkBoxUpdate);
      $toggleBrands.on('click',  filterToggle);
      $formReset.on('click', resetForm);

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

      $priceFilterBtn.on('click', {
        param: 'priceFilter',
        action: true
      }, updateSearch);
    };

    var paginateResults = function () {
      if ($paginationEle.length) {
        var currPage = parseInt($paginationEle.attr('current-page'));
        var lastPage = parseInt($paginationEle.attr('last-page'));
        var visPages = 7;
        var getUrl = window.location.pathname;
        var baseUrl = window.location.protocol + '//' + window.location.host;
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

