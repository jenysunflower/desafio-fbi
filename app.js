import express from 'express';
import jwt from 'jsonwebtoken';
import { users } from './data/agentes.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const secretKey = "clave ultra secreta";
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/SignIn", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(
        (usuario) => usuario.email == email && usuario.password == password
    );

    if (user) {
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 120, // 2 minutos
                data: user,
            },
            secretKey
        );

        res.redirect(`/secret?token=${token}`);
    } else {
        res.status(401).json({ // Estado http de no autorizado
            error: "Unauthorized",
            message: "Credenciales incorrectas. Por favor, inténtalo de nuevo."
        });
    }
});

app.get("/secret", (req, res) => {
    const token = req.query.token; // Obtener el token de la query string

    if (!token) {
        res.redirect("/");
        return;
    }

    jwt.verify(token, secretKey, (error, decoded) => {
        if (error) {
            res.status(401).send("No autorizado, intente nuevamente");
        } else {
            res.send(`
                <h1>FBI</h1>
                <p>Agente, ${decoded.data.email}!</p>
                <p>ACCEDER A RUTA RESTRINGIDA </p>
                <a href="#" onclick="rutaRestringida()">Acceda aquí</a> 
                <script>
                    // Esto es para guardar el token en el sessionStorage del navegador
                    sessionStorage.setItem('token', '${token}');

                    const rutaRestringida = () => {
                        const token = sessionStorage.getItem('token');
                        fetch('/ruta-restringida', {
                            method: 'GET',
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        })
                        .then(response => response.text())
                        .then(data => document.write(data))
                        .catch(error => {
                            console.error('Error:', error);
                            alert('No autorizado, intente nuevamente');
                        });
                    }
                </script>
            `);
        }
    });
});

// Ruta restringida
app.get('/ruta-restringida', (req, res) => {
    // Obtener el token desde la cabecera Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send("No autorizado, intente nuevamente");
    }
    jwt.verify(token, secretKey, (error, decoded) => {
        if (error) {
            return res.status(401).send("No autorizado, intente nuevamente");
        } else {
            res.send(`
                <h1>FBI</h1>
                <p>Agente, ${decoded.data.email}!</p>
                <p>¡Bienvenido a la ruta restringida!</p>
            `);
        }
    });
});

app.listen(port, () => console.log('Servidor arriba'));
