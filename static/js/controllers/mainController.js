// This controller is used outside ng-view
angular.module('myApp').controller('mainController', ['$scope', '$rootScope', '$http', '$window', '$routeParams', '$route', '$location', '$filter', 'appApi', 'alertsFactory', 'appConfig', 'Mixins', function($scope, $rootScope, $http, $window, $routeParams, $route, $location, $filter, appApi, alertsFactory, appConfig, Mixins) {
    // current controller is on top level, so all http
    // errors should come through it
    $scope.alerts = alertsFactory;
    $scope.mixins = Mixins;
    $scope.statusMap = appConfig.statusMap;
    $scope.resultMap = appConfig.resultMap;
    $scope.pangram = appConfig.pangram;

    $scope.repos_list = null;
    $scope.app_info = null;
    $scope.repo_info = null;
    $rootScope.metadata = null;

    $scope.repo_is_valid = false;
    $scope.repo_current = null;
    $rootScope.repo_selected = {name: null};

    $scope.initDone = function() {
        return $rootScope.metadata != null &&
            $scope.repos_list != null &&
            $scope.app_info != null &&
            $scope.repo_info != null &&
            $scope.repo_current != null
    };

    $scope.filterWithQuicksilverRanking = function(val1, val2) {
        //#TODO make score configurable?
        // Add some control in search box
        // to use either strict search (score > 0.8),
        // flexible search (score > 0.3) ?
        try {return val1.score(val2) > 0.3;}
        catch (e) {return false;}
    };

    $scope.filterReposList = function(criteria) {
        return function(item) {
            return $scope.filterWithQuicksilverRanking(item.submodule, criteria);
        };
    };

    $scope.isRoot = function() {
        return $location.path() == '/';
    };

    appApi.getRepos().then(function(dataResponse) {
        $scope.repos_list = dataResponse.data;
    });

    $scope.onRepoSelect = function ($item, $model, $label) {
        //#TODO refactor this horror!!!
        var loc_path = $location.path(),
            hash_tag= '#';
        if (loc_path == '/') {
            $window.location.href = [hash_tag, 'fontdirectory', $item.submodule].join('/');
        } else {
            var parts = loc_path.split('/');
            parts[0] = hash_tag;
            parts[1] = 'fontdirectory';
            parts[2] = $item.submodule;
            $window.location.href = parts.join('/');
        }
//        $route.reload();
        $window.location.reload();
        if ($rootScope.metadata) {
            $rootScope.repo_selected.name = $rootScope.metadata.name;
        }
    };

    $scope.$on('$routeChangeSuccess', function() {
        $scope.repo_current = {
            owner: $routeParams.repo_owner,
            name: $routeParams.repo_name
        };

        appApi.getRepos().then(function(dataResponse) {
            $scope.repos_list = dataResponse.data;
            if ($scope.repo_current.name === null || $scope.repo_current.name === undefined || $scope.repo_current.owner === null || $scope.repo_current.owner === undefined) {
                $scope.repo_is_valid = false;
            }
            else {
                appApi.checkRepo($scope.repo_current).then(
                    function(dataResponse) {
                        $scope.repo_is_valid = true;
                        appApi.setActiveRepo($scope.repo_current);

                        appApi.getAppInfo().then(function(dataResponse) {
                            $scope.app_info = dataResponse.data;
                        });

                        appApi.getRepoInfo().then(function(dataResponse) {
                            $scope.repo_info = dataResponse.data;
                        });

                        appApi.getMetadata().then(
                            function(dataResponse) {
                                $rootScope.metadata = dataResponse.data;
                                $rootScope.repo_selected.name = $rootScope.metadata.name;
                            },
                            function(error) {
                                appApi.getMetadataNew().then(function(dataResponse) {
                                    $rootScope.metadata = dataResponse.data;
                                    $rootScope.repo_selected.name = $rootScope.metadata.name;
                                });
                            });
                    },
                    function(error) {
                        $scope.repo_is_valid = false;
                        if ($location.path() != '/') {
                            $window.location.href = '/';
                        }
                    });
            }
        });
    });
    $scope.$on('$viewContentLoaded', function() {
        // can be used as a signal to other controllers?
    });
}]);