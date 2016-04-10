// Store search view

(function ($) {
  $(document).ready(function() {
    var $brandFilters = $('#brand-filters'),
    $brandFiltersCont = $('#brand-filters-cont'),
    $selectedBrands = $('<ul class="brands-selected" />'),
    $brandsCont = $('<ul class="brands-continued" />'),
    $selectedEle = $('.selectedBrand');

    var filterUpdate = function () {
      $brandFiltersCont.prepend($selectedBrands).append($brandsCont);
      $brandFilters.find($selectedEle).each(function () {
        $selectedBrands.prepend($(this));
      });
      $brandFilters.not($selectedEle).each(function () {
        $brandsCont.prepend($(this));
      });
    };

    var init = function () {
      filterUpdate();
    };

    init();

  });

} (jQuery));

