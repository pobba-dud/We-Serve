<html>
    <head>
        <title>connecting to mysql with php</title>
    </head>
    <body>
        <?PHP
        $dbhost = "localhost";
        $dbuser = "root";
        $dbpass = "";
        $mysqli = new mysqli($dbhost, $dbuser, $dbpass);
        if($mysqli -> connect_error){
            printf("connection failed", $mysqli -> connect_error);
        }
        printf("connected sucessfully");
        $mysqli -> close();
        ?>
    </body>
</html>