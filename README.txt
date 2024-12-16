Developers:
make sure u make consistant comments 
and label you commits as it makes it easy for 
anyone else working on the projects to modify
to enable a less arduious development

(I hate comments too but itll help 
everyone working on this project)
make sure to use header, footer, main, and nav tags to increase the organization in the html code

Sexy blue:
 #4747c4
 -jordynn

changed our old dark blue to --> #283A43
if i forgot anything, please change the color to this, thank you.
     -jordynn

idiot blue: #9bd1e5
pulchritudinous grey: #c7c5b8

15 days untill Brent can google external login

to test with node.js:
     -type in "Set-ExecutionPolicy Bypass -Scope Process" in the command prompt
     - install Chocolatey with this line of code:
          "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.WebClient]::New().DownloadString('https://community.chocolatey.org/install.ps1') | Invoke-Expression" 
     -install fnm with this line of code:
          "choco install fnm"     
     -go to "https://nodejs.org/en/download/package-manager"
     -install node.js (I can help u)
          "# installs fnm (Fast Node Manager)
          winget install Schniz.fnm

          # configure fnm environment
          fnm env --use-on-cd | Out-String | Invoke-Expression

          # download and install Node.js
          fnm use --install-if-missing 22

          # verifies the right Node.js version is in the environment
          node -v # should print `v22.12.0`

          # verifies the right npm version is in the environment
          npm -v # should print `10.9.0`"
     -test if it installed by typing "node -v" in the command prompt (should return an number)
     -type in the terminal "node server.js"
     -then go to ur browser and type "http://localhost:3000"
     -and bam buttons and links work again

Creating events in calendar causes dultipcate events in discover one being undefinted 