// Store search view

(function ($) {
  $(document).ready(function () {
    var $brandFilters = $('#brand-filters'),
    $toggleBrandsEle = $('<li class="show-toggle"><a class="blue-link" id="toggleMoreBrands" href="javascript:;">+ Show More</a></li>'),
    $selectedBrand = $('.selectedBrand'),
    $formReset = $('#productListReset'),
    $resultLimitDropdowns = $('.searchLimitResults'),
    $searchSortBy = $('#search-sortBy'),
    numPerPageInt = 15,
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
        $brandFilters.find('li').not(controls).addClass('hide');
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
    };

    var mirrorDropdowns = function() {
      $resultLimitDropdowns.change(function(e) {
        $resultLimitDropdowns.val(this.value);
        numPerPageInt = this.value;
      });
    };

    var updateSearch = function (paramToSet) {
      var newVal = function() {
        switch(paramToSet) {
          case 'numPerPage' :
            return numPerPageInt;
          case 'sortBy' :
            return $searchSortBy.val();
      }}();
      if ($.query) {
        console.log('works', paramToSet, newVal);
        var updateSearch = $.param($.query.set(paramToSet, newVal).keys); window.location.search = '?' + updateSearch;
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
      $resultLimitDropdowns.on('change', mirrorDropdowns);
      $searchSortBy.on('change', updateSearch('sortBy'));
    };

    var init = function () {
      $brandFilters.append($toggleBrandsEle);
      filterToggle();
      bindThem();
    };

    init();

  });

} (jQuery));

