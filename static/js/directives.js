// directive to handle class attr of navigation menu items (eg, set/rm "active")
// #TODO make navigation menu as a separate component
angular.module('myApp').directive('navMenu', ['$location', function($location) {
    function activeLink(scope, element, attrs) {
        var links = element.find('a'),
            activeClass = attrs.navMenu || 'active',
            routePattern,
            link,
            url,
            currentLink,
            urlMap = {},
            i;
        if (!$location.$$html5) {
            routePattern = /^#[^/]*/;
        }

        for (i = 0; i < links.length; i++) {
            link = angular.element(links[i]);
            url = link.attr('href');

            if ($location.$$html5) {
                urlMap[url] = link;
            } else {
                urlMap[url.replace(routePattern, '')] = link;
            }
        }

        scope.$on('$routeChangeStart', function() {
            var pathLink = urlMap[$location.path()];
            if (pathLink) {
                if (currentLink) {
                    currentLink.parent('li').removeClass(activeClass);
                }
                currentLink = pathLink;
                currentLink.parent('li').addClass(activeClass);
            }
        });
    }
    return {
        link: activeLink
    }
}]);

angular.module('myApp').directive('insertGlyph', ['$compile', function($compile) {
    var getTemplate = function(is_missing) {
        return is_missing ? '<div style="display: none;"><span class="defaultCharacter">{{ glyph_decoded }}</span><span class="missing-glyph">X</span></div>' : '<div><span class="defaultCharacter">{{ glyph_decoded }}</span><span>{{ glyph_decoded }}</span></div>';
    };
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var el = $compile(getTemplate(scope.is_missing))(scope);
            element.replaceWith(el);
        }
    };
}]);
