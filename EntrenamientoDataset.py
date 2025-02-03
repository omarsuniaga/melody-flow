import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Embedding, LSTM
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import json
import sys
import ipywidgets as widgets
from IPython.display import display
import re
import datetime

# Asegurar compatibilidad con el entorno
print(f"Python version: {sys.version}")
print(f"TensorFlow version: {tf.__version__}")

# Mapeo de etiquetas a valores numéricos
activity_type_map = {"Eventual": 0, "Fijo": 1}
payment_status_map = {"Pendiente": 0, "Pagado": 1}

def process_amount(amount_text):
    return int(re.sub(r'[^0-9]', '', amount_text)) if amount_text else 0

def process_time(time_text):
    match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', time_text, re.IGNORECASE)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2)) if match.group(2) else 0
        if match.group(3) and match.group(3).lower() == 'pm' and hour != 12:
            hour += 12
        return f"{hour:02}:{minute:02}"
    return "00:00"

def process_date(date_text):
    today = datetime.date.today()
    weekdays = {"lunes": 0, "martes": 1, "miércoles": 2, "jueves": 3, "viernes": 4, "sábado": 5, "domingo": 6}
    for day, index in weekdays.items():
        if day in date_text.lower():
            target_date = today + datetime.timedelta((index - today.weekday()) % 7)
            return target_date.strftime("%Y-%m-%d")
    return "YYYY-MM-DD"

# Simulación de dataset con valores numéricos convertidos
dataset = [
    {"prompt": "Evento: Concierto de jazz en el teatro principal, 8PM, costo: 50USD, pagado.",
     "label": ["Jazz Company", "Teatro Principal", "Concierto de jazz", process_time("8PM"), process_date("viernes"), process_amount("50USD"), activity_type_map["Fijo"], payment_status_map["Pagado"]]},
    {"prompt": "Reunión con proveedor de sonido, 3PM en la oficina central, pendiente de pago.",
     "label": ["Proveedor de Sonido", "Oficina Central", "Reunión con proveedor", process_time("3PM"), process_date("lunes"), process_amount("0"), activity_type_map["Eventual"], payment_status_map["Pendiente"]]}
]

# Tokenización del texto
tokenizer = Tokenizer(num_words=5000, oov_token="<OOV>")
texts = [d["prompt"] for d in dataset]
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded_sequences = pad_sequences(sequences, maxlen=50, padding='post')

# Convertir etiquetas en valores numéricos
labels = np.array([d["label"] for d in dataset], dtype=np.float32)

# Definir el modelo de aprendizaje profundo
model = Sequential([
    Embedding(input_dim=5000, output_dim=64, input_length=50),
    LSTM(64, return_sequences=True),
    LSTM(32),
    Dense(32, activation='relu'),
    Dense(8, activation='sigmoid')  # 8 salidas para cada campo
])

# Compilar el modelo
model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# Entrenar el modelo
model.fit(padded_sequences, labels, epochs=50, batch_size=2, verbose=1)

# Guardar el modelo entrenado
model.save("event_prompt_model.h5")

# Función para predecir con el modelo
def predict_event(prompt_text):
    sequence = tokenizer.texts_to_sequences([prompt_text])
    padded_sequence = pad_sequences(sequence, maxlen=50, padding='post')
    prediction = model.predict(padded_sequence)[0]
    
    event_data = {
        "provider": "Desconocido",
        "location": "Desconocido",
        "description": "Extraído del prompt",
        "time": process_time(prompt_text),
        "date": process_date(prompt_text),
        "amount": process_amount(prompt_text),
        "activityType": "Fijo" if prediction[6] > 0.5 else "Eventual",
        "paymentStatus": "Pagado" if prediction[7] > 0.5 else "Pendiente"
    }
    return event_data

# Crear interfaz interactiva para entrenar con nuevas respuestas
def interactive_prompt():
    prompt_input = widgets.Textarea(
        placeholder="Ingrese un nuevo evento...",
        layout=widgets.Layout(width='80%', height='100px')
    )
    
    output_area = widgets.Output()
    
    def on_submit(_):
        with output_area:
            output_area.clear_output()
            result = predict_event(prompt_input.value)
            print("Predicción inicial:", json.dumps(result, indent=2))
    
    submit_button = widgets.Button(description="Procesar Prompt")
    submit_button.on_click(on_submit)
    
    display(prompt_input, submit_button, output_area)

# Ejecutar la interfaz interactiva
interactive_prompt()
