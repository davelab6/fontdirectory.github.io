angular.module('myApp').controller('reposController', ['$scope', '$routeParams', '$filter', '$q', '$http', 'reposApi', 'ngTableParams', function($scope, $routeParams, $filter, $q, $http, reposApi, ngTableParams) {
    $scope.dataLoaded = false;
    $scope.OAuth_passed = false;

    $scope.authenticateWithOAuth = function() {
        OAuth.initialize('ZapNqQn-kP45Mq8tXYZi0u_G9bc');
        OAuth.popup('github', {cache: true})
            .done(function(success){
                // See the result below
                $scope.OAuth_passed = true;
                reposApi.getCollection(success['access_token']).then(function(dataResponse) {
                    var filtered_tree_data = dataResponse.data.tree.filter(function(item) {
                        return "160000" == item.mode && "commit" == item.type;
                    });

                    $scope.buildsTableParams = new ngTableParams({
                        // show first page
                        page: 1,
                        // count per page
                        count: 25,
                        // initial sorting
                        sorting: {
                            fontdirectory_link: 'asc'
                        }
                    }, {
                        // hide page counts control
                        //counts: [],
                        // length of data
                        total: filtered_tree_data.length,
                        getData: function($defer, params) {
                            var data = [],
                                build_date_errors = [],
                                tests_passing_errors = [];
                            var sliced = filtered_tree_data.slice((params.page() - 1) * params.count(), params.page() * params.count());
                            angular.forEach(sliced, function(item, index) {
                                var info = {};

                                var path = item.path.split('/')[1];

                                // ignore fontbakery repo, as it is not a font repo
                                if (path == 'fontbakery') {
                                    return
                                }

                                //tdName
                                info['_orig_item'] = item;
                                info['fontdirectory_link'] = 'https://github.com/fontdirectory/' + path;

                                //tdBuildStatus
                                info['travis_link'] = 'http://travis-ci.org/fontdirectory/' + path;
                                info['travis_img'] = 'https://travis-ci.org/fontdirectory/' + path + '.svg';

                                //tdBuildReport
                                info['build_report'] = 'https://fontdirectory.github.io/' + path;

                                // row has columns: tdName, tdBuildDate, tdBuildStatus, tdBuildReport, tdPassingTests

                                $http.get('https://cdn.rawgit.com/fontdirectory/' + path + '/gh-pages/summary.tests.json', {nointercept: true}).then(function(dataResponse) {
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
                                    tests_passing_errors.push(error.status + ' - ' + error.statusText + ': ' + error.config.url);
                                    info['totalTests'] = null;
                                    info['successTests'] = null;
                                    info['passingTests'] = null;
                                    info['noTestsInfo'] = {status: error.status + ' - ' + error.statusText, url: error.config.url};
                                });

                                $http.get('https://api.travis-ci.org/repos/fontdirectory/' + path, {headers: { 'Accept': 'application/vnd.travis-ci.2+json' }, nointercept: true}).then(function(dataResponse) {
                                    info['build_date'] = dataResponse.data.repo.last_build_finished_at;
                                }, function(error) {
                                    build_date_errors.push(error.status + ' - ' + error.statusText + ': ' + error.config.url);
                                    info['build_date'] = null;
                                });
                                data.push(info);
                            });
                            data = params.sorting() ?
                                $filter('orderBy')(data, params.orderBy()) :
                                data;
                            $defer.resolve(data);
                            angular.element('div.ng-table-pager').addClass('text-center');
                            if (build_date_errors.length > 0) {
                                $scope.alerts.addAlert('Failed to get information about builds for '+build_date_errors.length+' items. Please see table below.');
                            }
                            if (tests_passing_errors.length > 0) {
                                $scope.alerts.addAlert('Failed to get information about tests for '+tests_passing_errors.length+' items. Please see table below.');
                            }
                        }
                    });
                    $scope.dataLoaded = true;
                }, function(error) {
                    $scope.alerts.addAlert(error.message);
                });
            })
            .fail(function(error) {
                $scope.OAuth_passed = false;
            });
    };
    $scope.init = function () {
        if (!$scope.OAuth_passed) {
            $scope.authenticateWithOAuth();
        }
    };
    $scope.init();
}]);