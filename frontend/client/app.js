var httpRequest = new XMLHttpRequest();
var response;
var form = document.querySelector('#form-sub')
var email = null
result = document.querySelector('#bloc')
result.style.display = 'none'
form.addEventListener('submit', function(e){
    e.preventDefault()
    httpRequest.onreadystatechange = function() {
        email = document.querySelector('#email').value.toString()
        console.log(email)
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                result.style.display = 'block'
                resultTest = JSON.parse(httpRequest.responseText)
                if(resultTest['spam']){
                    result.className = 'alert alert-danger mt-4'
                    result.textContent = "ce mail est un spam avec une probalite de " + (parseFloat(resultTest['probalite']).toFixed(4)*100) + '%'
                }
                else{
                    result.className = 'alert alert-success mt-4'
                    result.textContent = "ce mail est un ham avec une probalite de " + (parseFloat(1 - resultTest['probalite']).toFixed(4))*100 + '%'
                }
                //document.querySelector("#result").innerHTML = "<strong>" + httpRequest.responseText + "</strong>"
            } else {
                alert("Erreur le serveur est indisponible")
            }
        } 
    };
    var send_mail = 'https://flo52.pythonanywhere.com/api/spamdetector?mail='.concat(email) 
    console.log(send_mail)
    httpRequest.open('GET', send_mail, true);
    httpRequest.send();
}, false)
