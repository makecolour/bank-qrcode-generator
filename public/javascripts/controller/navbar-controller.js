app.controller('navbar-controller', ['$scope', '$window', function ($scope, $window) {
    $scope.theme = 'light';

    $scope.changeTheme = function (theme = null) {
        if (theme === null) {
            const userPrefersDark = $window.matchMedia && $window.matchMedia('(prefers-color-scheme: dark)').matches;
            $scope.theme = userPrefersDark ? 'dark' : 'light';
        } else {
            $scope.theme = theme;
        }

        try {
            $window.localStorage.setItem('theme', $scope.theme);
        } catch (e) {
            console.error('Failed to save theme to localStorage:', e);
        }

        const body = document.body;
        body.setAttribute('data-bs-theme', $scope.theme);

        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(tabPane => {
            tabPane.classList.toggle('bg-dark', $scope.theme === 'dark');
            tabPane.classList.toggle('bg-light', $scope.theme !== 'dark');
        });
    };

    $scope.init = function () {
        let storedTheme = null;

        try {
            storedTheme = $window.localStorage.getItem('theme');
        } catch (e) {
            console.error('Failed to read theme from localStorage:', e);
        }

        $scope.changeTheme(storedTheme);
    };

    $scope.init();
}]);
