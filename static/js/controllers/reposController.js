angular.module('myApp').controller('reposController', ['$scope', '$routeParams', '$filter', '$q', '$http', 'reposApi', 'ngTableParams', 'amMoment', function($scope, $routeParams, $filter, $q, $http, reposApi, ngTableParams, amMoment) {
    $scope.dataLoaded = false;
    $scope.OAuth_passed = false;
    var data = [],
        build_date_errors = [],
        tests_passing_errors = [];

    var getBuildInfo = function(element, scope) {
        $http.get('https://api.travis-ci.org/repos/fontdirectory/' + scope.build.name, {headers: { 'Accept': 'application/vnd.travis-ci.2+json' }, nointercept: true}).then(function(dataResponse) {
            scope.build.build_date_orig = dataResponse.data.repo.last_build_finished_at;
        }, function(error) {
            build_date_errors.push(error.status + ' - ' + error.statusText + ': ' + error.config.url);
            scope.build.build_date_orig = null;
        });
    };

    var getTestsInfo = function(element, scope) {
        $http.get('https://cdn.rawgit.com/fontdirectory/' + scope.build.name + '/gh-pages/summary.tests.json', {nointercept: true}).then(function(dataResponse) {
            var tests_data = dataResponse.data,
                totalTests = 0,
                successTests = 0;
            for (d in tests_data) {
                totalTests += tests_data[d].success + tests_data[d].error + tests_data[d].failure;
                successTests += tests_data[d].success;
            }
            scope.build['totalTests'] = totalTests;
            scope.build['successTests'] = successTests;
            scope.build['passingTests'] = Math.round((successTests / totalTests) * 100) + '%'
        }, function(error) {
            tests_passing_errors.push(error.status + ' - ' + error.statusText + ': ' + error.config.url);
            scope.build['totalTests'] = null;
            scope.build['successTests'] = null;
            scope.build['passingTests'] = null;
            scope.build['noTestsInfo'] = {status: error.status + ' - ' + error.statusText, url: error.config.url};
        });
    };

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
                        count: filtered_tree_data.length,
                        // initial sorting
                        sorting: {
                            fontdirectory_link: 'asc'
                        }
                    }, {
                        // hide page counts control
                        counts: [],
                        // length of data
                        total: filtered_tree_data.length,
                        getData: function($defer, params) {

                            angular.forEach(filtered_tree_data, function(item, index) {
                                var info = {};

                                var path = item.path.split('/')[1];

                                // ignore fontbakery repo, as it is not a font repo
                                if (path == 'fontbakery') {
                                    return
                                }

                                //tdName
                                info['path'] = item.path;
                                info['name'] = path;
                                info['fontdirectory_link'] = 'https://github.com/fontdirectory/' + path;

                                //tdBuildStatus
                                info['travis_link'] = 'http://travis-ci.org/fontdirectory/' + path;
                                info['travis_img'] = 'https://travis-ci.org/fontdirectory/' + path + '.svg';

                                //tdBuildReport
                                info['build_report'] = 'https://fontdirectory.github.io/' + path;
                                info['getBuildInfoCallback'] = getBuildInfo;
                                info['getTestsInfoCallback'] = getTestsInfo;

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
                            $scope.dataLoaded = true;
                        }
                    });
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