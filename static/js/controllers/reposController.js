angular.module('myApp').controller('reposController', ['$scope', '$routeParams', '$filter', '$q', '$http', 'reposApi', 'ngTableParams', 'amMoment', function($scope, $routeParams, $filter, $q, $http, reposApi, ngTableParams, amMoment) {
    $scope.dataLoaded = false;
    $scope.OAuth_passed = false;
    $scope.reqCounter = 0;
    $scope.filteredTreeData = 0;
    $scope.itemsLoaded = false;

    var data = [],
        build_date_errors = [],
        tests_passing_errors = [];

    $scope.getItemsLoaded = function() {
        // there are 2 additional requests
        // per row - 1st for build date, 2nd - for tests results
        var current = parseFloat($scope.reqCounter/2);
        var total = $scope.filteredTreeData.length;
        $scope.itemsLoaded = current >= total-1 ? true:false;
        return parseInt(current)+'/'+parseInt(total);
    };

    var getBuildInfo = function(element, scope) {
        $http.get('https://api.travis-ci.org/repos/fontdirectory/' + scope.build.repoName, {headers: { 'Accept': 'application/vnd.travis-ci.2+json' }, nointercept: true}).then(function(dataResponse) {
            //dataResponse.data.repo has attrs
            // description: null
            // github_language: null
            // id: 2678960
            // last_build_duration: 598
            // last_build_finished_at: "2014-10-06T13:00:19Z"
            // last_build_id: 37177838
            // last_build_language: null
            // last_build_number: "11"
            // last_build_started_at: "2014-10-06T12:50:21Z"
            // last_build_state: "passed"
            // slug: "fontdirectory/arimo"
            scope.build.buildDateOrig = dataResponse.data.repo.last_build_finished_at;
            scope.build.buildStatus = dataResponse.data.repo.last_build_state;
            $scope.reqCounter++;
        }, function(error) {
            $scope.reqCounter++;
            build_date_errors.push(error.status + ' - ' + error.statusText + ': ' + error.config.url);
            scope.build.buildDateOrig = null;
            scope.build.buildStatus = null;
        });
    };

    var getTestsInfo = function(element, scope) {
        $http.get('https://cdn.rawgit.com/fontdirectory/' + scope.build.repoName + '/gh-pages/summary.tests.json', {nointercept: true}).then(function(dataResponse) {
            var tests_data = dataResponse.data,
                totalTests = 0,
                successTests = 0;
            $scope.reqCounter++;
            for (d in tests_data) {
                totalTests += tests_data[d].success + tests_data[d].error + tests_data[d].failure;
                successTests += tests_data[d].success;
            }
            scope.build['totalTests'] = totalTests;
            scope.build['successTests'] = successTests;
            scope.build['passingTests'] = Math.round((successTests / totalTests) * 100) + '%'
        }, function(error) {
            $scope.reqCounter++;
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

                    $scope.filteredTreeData = dataResponse.data.tree.filter(function(item) {
                        return "160000" == item.mode && "commit" == item.type && item.path.split('/')[1] != 'fontbakery';
                    });

                    $scope.buildsTableParams = new ngTableParams({
                        // show first page
                        page: 1,
                        // count per page
                        count: $scope.filteredTreeData.length,
                        // initial sorting
                        sorting: {
                            repoPath: 'asc'
                        }
                    }, {
                        // hide page counts control
                        counts: [],
                        // length of data
                        total: $scope.filteredTreeData.length,
                        getData: function($defer, params) {
                            if ($scope.filteredTreeData.length != data.length) {
                                angular.forEach($scope.filteredTreeData, function(item, index) {
                                    var info = {};

                                    var path = item.path.split('/')[1];

                                    info['repoPath'] = item.path;
                                    info['repoName'] = path;
                                    info['repoLink'] = 'https://github.com/fontdirectory/' + path;
                                    info['travisLink'] = 'http://travis-ci.org/fontdirectory/' + path;
                                    info['travisImg'] = 'https://travis-ci.org/fontdirectory/' + path + '.svg';
                                    info['reportLink'] = 'https://fontdirectory.github.io/' + path;
                                    info['getBuildInfoCallback'] = getBuildInfo;
                                    info['getTestsInfoCallback'] = getTestsInfo;
                                    data.push(info);
                                });
                            }
                            data = params.sorting() ?
                                $filter('orderBy')(data, params.orderBy()) :
                                data;
                            $defer.resolve(data);
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
    $scope.$watch('reqCounter', function(reqCounter) {
        // force default sorting when all data is in table
        if ($scope.itemsLoaded) {
            if ($scope.buildsTableParams) {
                $scope.buildsTableParams.sorting();
            }
            if (build_date_errors.length > 0) {
                $scope.alerts.addAlert('Failed to get information about last build dates for '+build_date_errors.length+' items. Please see table below.', 'warning');
            }
            if (tests_passing_errors.length > 0) {
                $scope.alerts.addAlert('Failed to get information about tests statistics for '+tests_passing_errors.length+' items. Please see table below.', 'warning');
            }
        }
    })
}]);