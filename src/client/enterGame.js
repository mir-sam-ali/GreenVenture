if(window.location.pathname === "/"){
    document.getElementsByClassName("navbar")[0].classList.add("hide");
    
    
    
    document.getElementById("join-game-btn").addEventListener("click", () => {
        const username = document.getElementById("username-input").value;
        const gameroomcode = document.getElementById("gameroomcode-input").value;
    
        document.getElementById("gameroomcode").innerHTML = gameroomcode;
        document.getElementById("username").innerHTML = username;
    
        fetch(`http://localhost:2567/create/${gameroomcode}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
    
                document.getElementsByClassName("navbar")[0].classList.remove("hide");
                document.getElementsByClassName("join-window")[0].classList.add("hide");
    
                window.location.pathname = `/${gameroomcode}-${username}`;
            });
    
    });
}
else {
    const credentials = window.location.pathname.split("/")[1].split("-")

    document.getElementById("username").innerHTML = credentials[1];
    document.getElementById("gameroomcode").innerHTML = credentials[0];
    document.getElementsByClassName("join-window")[0].classList.add("hide");
}