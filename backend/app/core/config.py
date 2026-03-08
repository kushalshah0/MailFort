from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "MailFort Phishing Detection API"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    MODEL_PATH: str = "./models/bert-phishing-detector"
    MODEL_PATH_LSTM: str = "./models_data/lstm_model.pt"
    MODEL_PATH_GRU: str = "./models_data/gru_model.pt"
    TOKENIZER_PATH_RNN: str = "./models_data/rnn_tokenizer.pkl"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'


settings = Settings()
