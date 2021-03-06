'use strict';

angular.module('solumApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/login');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');
  })

  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        console.log('test auth request');
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          $location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })

  .run(function ($rootScope, $location, Auth, App) {
    $rootScope.$on('$stateChangeStart', function (event, next) {
      //check if user is logged in
      Auth.isLoggedInAsync(function(loggedIn) {
        console.log('state change',loggedIn, next);
        if (next.authenticate && !loggedIn) {
          $location.path('/login');
        } else if (next.landing && loggedIn) {
          //$location.path('/internal')
          //check if apps exist
          App.getAppsAsync(function(data){
            if(data.apps && data.apps.length > 0){
              $location.path('/apps');
            } else {
              $location.path('/get_started');
            }
          });
        }
      });
    });
  });