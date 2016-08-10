/*global WebFont */
/*global "https://localhost/images/static35/global/" */

var trustedAssetsURL = 'https://chmoore.github.io/trusted/' || '';

WebFont.load({
  google: {
    families: ['Noto+Serif:400,700,400italic,700italic']
  },
  custom: {
    families: [
      'FontAwesome',
      'gotham_htfbold'
    ],
    urls: [
      '//opensource.keycdn.com/fontawesome/4.6.3/font-awesome.min.css',
      trustedAssetsURL + 'assets/css/fonts.css'
    ]
  }
});
