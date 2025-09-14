FROM mongo:7.0

# Configurar variables de entorno
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=password
ENV MONGO_INITDB_DATABASE=scort-web-site

# Copiar script de inicialización
COPY backend/scripts/mongo-init.js /docker-entrypoint-initdb.d/

# Configurar permisos
RUN chmod +x /docker-entrypoint-initdb.d/mongo-init.js

# Exponer puerto
EXPOSE 27017

# Comando por defecto con autenticación
CMD ["mongod", "--auth", "--bind_ip_all"]