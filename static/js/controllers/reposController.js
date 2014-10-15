angular.module('myApp').controller('reposController', ['$scope', '$routeParams', '$filter', '$q', '$http', 'reposApi', 'ngTableParams', function($scope, $routeParams, $filter, $q, $http, reposApi, ngTableParams) {
    $scope.dataLoaded = false;
    $scope.OAuth_passed = false;
    var data = [];

    $scope.authenticateWithOAuth = function() {
        OAuth.initialize('ZapNqQn-kP45Mq8tXYZi0u_G9bc');
        OAuth.popup('github', {cache: true})
            .done(function(success){
                // See the result below
                $scope.OAuth_passed = true;
                reposApi.getCollection(success['access_token']).then(function(dataResponse) {
                    var head_data = dataResponse.data;
                    angular.forEach(head_data.tree, function(item, index) {
                        var info = {};
                        if ("160000" == item.mode && "commit" == item.type) {
                            var path = item.path.split('/')[1];

                            // ignore fontbakery repo, as it is not a font repo
                            if (path == 'fontbakery') {
                                return
                            }

                            /* start of debug speed up */
                            if (path != 'yesevaone' && path != 'kalam' && path != 'merriweather') {
                                return
                            }
                            /* end of debug speed up */

                            //tdName
                            info['fontdirectory_link'] = 'https://github.com/fontdirectory/' + path;

                            //tdBuildStatus
                            info['travis_link'] = 'http://travis-ci.org/fontdirectory/' + path;
                            info['travis_img'] = 'https://travis-ci.org/fontdirectory/' + path + '.svg';

                            //tdBuildReport
                            info['build_report'] = 'https://fontdirectory.github.io/' + path;

                            // row has columns: tdName, tdBuildDate, tdBuildStatus, tdBuildReport

                            $http.get('https://cdn.rawgit.com/fontdirectory/' + path + '/gh-pages/data/summary.tests.json').then(function(dataResponse) {
                                var tests_data = dataResponse.data,
                                    totalTests = 0,
                                    successTests = 0;
                                for (d in tests_data) {
                                    totalTests += tests_data[d].success + tests_data[d].error + tests_data[d].failure;
                                    successTests += tests_data[d].success;
                                }
                                info['totalTests'] = totalTests;
                                info['successTests'] = successTests;
                                info['passingTests'] = Math.round((successTests / totalTests) * 100) + '%'
                            }, function(error) {
                                $scope.alerts.addAlert(error.message);
                            });

                            $http.get('https://api.travis-ci.org/repos/fontdirectory/' + path, {headers: { 'Accept': 'application/vnd.travis-ci.2+json' }}).then(function(dataResponse) {
                                info['build_date'] = dataResponse.data.repo.last_build_finished_at;
                            }, function(error) {
                                $scope.alerts.addAlert(error.message);
                            });
                            data.push(info);
                        }
                    });
                    $scope.buildsTableParams = new ngTableParams({
                        // show first page
                        page: 1,
                        // count per page
                        count: data.length,
                        // initial sorting
                        sorting: {
                            fontdirectory_link: 'asc'
                        }
                    }, {
                        // hide page counts control
                        counts: [],
                        // length of data
                        total: data.length,
                        getData: function($defer, params) {
                            // use build-in angular filter
                            var orderedData = params.sorting() ?
                                $filter('orderBy')(data, params.orderBy()) :
                                data;
                            params.total(orderedData.length);
                            $defer.resolve(orderedData);
                        }
                    });
                    $scope.dataLoaded = true;
                }, function(error) {
                    $scope.alerts.addAlert(error.message);
                });
            })
            .fail(function(error) {
                $scope.OAuth_passed = false;
                $scope.alerts.addAlert(error.message);
            });
    };
    $scope.init = function () {
        if (!$scope.OAuth_passed) {
            $scope.authenticateWithOAuth();
        }
    };
    $scope.init();
}]);