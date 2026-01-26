from .db import Base, engine
from . import models

print("Criando tabelas do banco de dados...")
Base.metadata.create_all(bind=engine)
print("Tabelas criadas com sucesso!")
