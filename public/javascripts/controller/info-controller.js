app.controller('info-controller', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    $scope.qrData = {
        service_code: 'account',
        currency: 'VND',
        text_color: '#000000',
        text_background: '#ffffff',
        footer_color: '#000000',
    };
    $scope.qrResult = null;
    $scope.qrType = '';
    $scope.error = '';
    $scope.banks = [];
    $scope.services = [
        { code: 'account', name: 'Bank to account' },
        { code: 'card', name: 'Bank to card' }
    ];
    $scope.currency = [
        { code: 'VND', name: 'Vietnamese Dong' },
        { code: 'USD', name: 'US Dollar' },
    ]
    $scope.errorCorrectionLevels = [
        { code: 'L', name: 'Low' },
        { code: 'M', name: 'Medium' },
        { code: 'Q', name: 'Quartile' },
        { code: 'H', name: 'High' }
    ];

    // Fetch bank data
    $http.get('/api/v2/banks')
        .then(function(response) {
            $scope.banks = response.data;
        })
        .catch(function(error) {
            console.error('Error fetching banks:', error);
        });

    $scope.generateQR = function(type) {
        $scope.error = '';
        const url = 'api/qr-png-with-info';
        $http.get(url, { params: $scope.qrData })
            .then(function(response) {
                console.log(response);
                if(response.data.status === 'success') {
                    $scope.type = type;
                    $scope.qrResult = response.data.data;
                }
            })
            .catch(function(error) {
                console.error('Error generating QR code:', error);
                $scope.error = 'Error generating QR code: ' + error.data;
            });
    };
}]);