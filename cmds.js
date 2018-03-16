
const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");
const Sequelize = require('sequelize');


/**
 * Función de ayuda para los diversos comandos.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.helpCmd = rl => {
		log("Commandos:");
  		log(" h|help - Muestra esta ayuda.");
  		log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado");
  		log(" add - Añadir un nuevo quiz interactivamente.");
  		log(" delete <id> - Borrar el quiz indicado.");
  		log(" edit <id> - Editar el quiz indicado.");
  	    log(" test <id> - Probar ek quiz indicado.");
  		log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
  		log(" credits - Créditos.");
  		log(" q|quit - Salir del programa.");
  		rl.prompt();
 }

/**
 * Lista de todos los quizzes existentes en el modelo.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.listCmd = rl => {

 		models.quiz.findAll()
 		.each(quiz => {
 				log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} `);
 		})
 		.catch(error => {
 			errorlog(error.message);
 		})
 		.then(() => {
 			rl.prompt();
 		});



 }


/**
 * Esta funcion devuelve una promesa que:
 *  - Valida que se ha introducido un valor para el parámetro.
 *  - Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 *
 * @param id Parámetro con el índice a validar.
 */
 const validateId = id => {

 	return new Sequelize.Promise((resolve, reject) => {
 		if (typeof id === "undefined"){
 			reject(new Error(`Falta el parámetro <id>.`));
 		}  else {
 			id = parseInt(id);	//convertir el parámetro id en un número.

 			if (Number.isNaN(id)) {
 				reject(new Error(`El valor del parámetro <id> no es un número.`));
 			} else {
 				resolve(id);
 			}
 		}
 	});
 };


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
 exports.showCmd = (rl, id) => {
 		
 	validateId(id)
 	.then(id => models.quiz.findById(id))
 	.then(quiz => {
 		if (!quiz) {
 			throw new Error(`No existe un quiz asociado al id=${id}.`);
 		}
 		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
 	})
 	.catch(error => {
 		errorlog(error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

/**
 * Esta funcion devuelve una promesa que cuando se cumple, proporciona el texto introducido
 * Entonces la llamada a then que hay que hacer la promesa devuelta, será:
 *			.then(answer => {....})
 *
 * También colorea en rojo el texto de la pregunta, elimina espacios al principio y final.
 * 
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usario.
*/
const makeQuestion = (rl, text) =>{
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'cyan'), answer =>{
			resolve(answer.trim());
		});
	});
};



 /**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada rl.prompt() se debe hacer en la callback de la segunda llamada
 * a rl.question.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.addCmd = rl => {
 	makeQuestion(rl, 'Introduzca una pregunta: ')
 	.then(q => {
 		return makeQuestion(rl, 'Introduzca la respuesta: ')
 		.then(a =>{
 			return {question: q, answer: a};
 		});
 	})
 	.then(quiz => {
 		return models.quiz.create(quiz);
 	})
 	.then(quiz => {
 		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${answer.question}. `);
 	})
 	.catch(Sequelize.ValidationError, error => {
 		errorlog('El quiz es erroneo: ');
 		error.errors.forEach(({message}) => errorlog(message));
 	})
 	.catch(error => {
 		errorlog(error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

 /**
 * Prueba un quiz del modelo.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id clave del quiz a probar.
 */
 exports.testCmd = (rl, id) => {

 		validateId(id)
 		.then(id => models.quiz.findById(id) )
 		.then(quiz => {
 			if (!quiz) {
 				throw new Error(`No existe un quiz asociado al id=${id}.`);
 			}
 			log(`La pregunta es: ${quiz.question} `);
 			return makeQuestion(rl, 'Introduzca la respuesta: ')
 				.then(a =>{
 					if(a.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim() === quiz.answer.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim()) {
 						log('CORRECTA', 'green');
 					} else {
 						log('INCORRECTA', 'red');
 					}
 				});
 		})
 		.catch(error =>{
 			errorlog(error.message);
 		})
 		.then(() => {
 			rl.prompt();
 		});
 		// ____________________________________________________________________________________________________________________
 		//if(typeof id === "undefined"){
 		//	errorlog(`Falta el parámetro id.`);
 		//	rl.prompt();
 		//} else {
 		//	try{
 		//		const quiz = model.getByIndex(id);
 		//		log(`La pregunta es : ${quiz.question}`);
 		//
 		//		rl.question(`Introduce la respuesta: `, answer => {
 		//			// Respuesta del jugador
	 	//		 var answerSimbol = answer.replace(/[^a-zA-Z 0-9.]+/g,' ');	// eliminar símbolos raros
	 	//		 var answerSpace = answerSimbol.replace(/\s+/g,' ');   	// eliminar espacios
	 	//		 var answerToCmp = answerSpace.toLowerCase().trim();			// cambio de mayusculas a minusculas

	 			 	// Respuesta correcta del test
	 	//		 var goodAnswer = quiz.answer.toLowerCase().trim();				// cambiar de mayusculas a minusculas
 		//			if(answerToCmp === goodAnswer){
 		//				log('Su respuesta es: ');
 		//				log('CORRECTA','green');
 		//			} else {
 		//				log('Su respuesta es: ');
 		//				log('INCORRECTA','red');
 		//			}
 		//			rl.prompt();
 		//		});
 		//	} catch (error){
 		//		errorlog(error.message);
 		//		rl.prompt();
 		//	}
 		//	
 		//}
 		// __________________________________________________________________________________________________________________

 };

 /**
 * Pregunta todos los quizzes existentes de forma aleatoria.
 * Se gana si se contesta todos satisfactoriamente.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.playCmd = rl => {
 	let score = 0;
 	let numQuestion = 0;
 	let toBeResolved = [];

 	models.quiz.findAll()
 	.each(quiz => {
 		++numQuestion;
 		toBeResolved.lenght = numQuestion;
 		toBeResolved.push(quiz.id);
 	})
 	.then(() => {
 		if (numQuestion == 0) {
 			log('No hay preguntas por jugar, lo siento.', 'red');
 		} else {
 			playOne();
 		}
 	})
 	.catch(error => {
 		errorlog(error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});

 	const playOne = () => {

 		let randomId = Math.floor(Math.random()*(numQuestion-score)); // numero al azar del array de IDs
 		
 		models.quiz.findById(toBeResolved[randomId])
 		.then(quiz => {
 			log(`La pregunta es: ${quiz.question} `);
 			return makeQuestion(rl, 'Introduzca la respuesta: ')
 				.then(a =>{
 					if(a.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim() === quiz.answer.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim()) {
 						log('CORRECTO', 'green');
 						++score;
 						if(score < numQuestion){
 							toBeResolved.splice(randomId, 1);	//Eliminar el la pregunta de la posicion randomId
 							rl.prompt();
 							playOne();
 						} else {
 							log('Enhorabuena!!!', 'green');
	 			 			log('Has acertado todas las preguntas', 'green');
 						}
 					} else {
 						log(`Su respuesta es: ${colorize('INCORRECTA', 'red')} `);
	 				 	log(`Ha acertado: ${colorize(score, 'magenta')} de ${colorize(numQuestion, 'magenta')} preguntas`);
	 				 	log('FIN DEL JUEGO', 'yellow');	
 					}
 				})
 				.catch(error => {
 					errorlog(error.message);
 				})
 				.then(() => {
 					rl.prompt();
 				});
 		})	
 		.catch(error => {
 			errorlog(error.message);
 		})
 		.then(() => {
 			rl.prompt();
 		});
 	};

}; 

 		// __________________________________________________________________________________________________________________
 		//if(model.count() == 0){
 		//	log('No hay preguntas para jugar');
 		//	rl.prompt();
 		//	return;
 		//}

 		//var score = 0;
 		//var toBeResolved = [];						// es un array para cada id
 		//toBeResolved.lenght = model.count();  		// inicio de array con el numero de preguntas que hay
 		//var long = toBeResolved.lenght;

 		//for (var i=0; i<toBeResolved.lenght; i++){
 		//	toBeResolved.push(i);					// introducir los indices en un array
 		//}

 		//const playOne = () => {
 		//	var randomId = Math.floor(Math.random()*(long-score));	// numero al azar para el array de id
 		//	var idRandom = toBeResolved[randomId];
 		//	const quiz = model.getByIndex(idRandom);

 		//	log(`${quiz.question}? `);								//Se lanza la pregunta
 		//	rl.question('Introduce la respuesta: ', answer => {
	 			 	// Respuesta del jugador
	 	//		 var answerSimbol = answer.replace(/[^a-zA-Z 0-9.]+/g,' ');	// eliminar símbolos raros
	 	//		 var answerSpace = answerSimbol.replace(/\s+/g,' ');   	// eliminar espacios
	 	//		 var answerToCmp = answerSpace.toLowerCase().trim();			// cambio de mayusculas a minusculas

	 			 	// Respuesta correcta del test
	 	//		 var goodAnswer = quiz.answer.toLowerCase().trim();				// cambiar de mayusculas a minusculas

	 	//		 if (answerToCmp === goodAnswer){
	 	//		 	log(`Su respuesta es: CORRECTA `);
	 	//		 	++score;
	 	//		 	if(score < long){
	 	//		 		toBeResolved.splice(randomId, 1);		// eliminar 1 elemento desde la posición randomId
	 	//		 		rl.prompt();
	 	//				playOne();								// ejecución recursiva
	 	//	 		} else {
	 	//	 			log('Enhorabuena!!!');
	 	//	 			log('Has acertado todas las preguntas');
	 	//	 			rl.prompt();
	 	//	 		}
	 	//	 	} else {
		//	 		log(`Su respuesta es: INCORRECTA`);
	 	//		 	log(`Ha acertado: ${score} de ${long} preguntas`);
	 	//		 	log('FIN DEL JUEGO', 'yellow');
	 	//		 	rl.prompt();
	 	//		}
 		//	});
 		//}
 		//playOne();
 		// ____________________________________________________________________________________________________________________





 /**
 * Borra el quiz del modelo.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id clave del quiz a borrar.
 */
 exports.deleteCmd = (rl, id) => {
 	validateId(id)
 	.then(id => models.quiz.destroy({where: {id} }) )
 	.catch(error => {
 		errorlog(error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

 /**
 * Edita el quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada rl.prompt() se debe hacer en la callback de la segunda llamada
 * a rl.question.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id clave del quiz a editar.
 */
 exports.editCmd = (rl, id) => {
 	validateId(id)
 	.then(id => models.quiz.findById(id) )
 	.then(quiz => {
 		if(!quiz) {
 			throw new Error(`No existe un quiz asociado al id=${id}.`);
 		}

 		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
 		return makeQuestion(rl, 'Introduzca la pregunta: ')
 		.then(q => {
 			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
 			return makeQuestion(rl, 'Introduzca la respuesta: ')
 			.then(a => {
 				quiz.question = q;
 				quiz.answer = a;
 				return quiz;
 			});
 		});
 	})
 	.then(quiz => {
 		return quiz.save();
 	})
 	.then(quiz => {
 		log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
 	})
 	.catch(Sequelize.ValidationError, error => {
 		errorlog('El quiz es erroneo: ');
 		error.errors.forEach(({message}) => errorlog(message) );
 	})
 	.catch(error => {
 		errorlog(error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

 /**
 * Creditos y nombres de los autores del proyecto.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.creditsCmd = rl => {
 		log('Autores de la práctica:');
  		log('	1) Pablo Planelló San Segundo', 'green');
  		log('	2) Daniel de la Torre Lázaro', 'green');
  		rl.prompt();
 };

 /**
 * Terminar el programa.
 *
 * @param rl  Objeto readline usado para implemtentar el CLI
 */
 exports.quitCmd = rl => {
  		rl.close();
 };
