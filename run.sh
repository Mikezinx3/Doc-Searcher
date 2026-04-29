#!/bin/bash

# Script de inicialização do ABNT Formatter

echo "🚀 Iniciando ABNT Formatter..."

# Verificar se o venv existe
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv || {
        echo "❌ Erro: python3-venv não está instalado."
        echo "   Instale com: sudo apt install python3.12-venv"
        exit 1
    }
fi

# Ativar venv e instalar dependências
source venv/bin/activate

echo "📦 Instalando dependências..."
pip install -r requirements.txt --quiet

# Criar diretórios necessários
mkdir -p uploads processed

echo ""
echo "✅ Servidor pronto!"
echo "🌐 Acesse: http://localhost:5000"
echo ""
echo "Pressione Ctrl+C para parar"
echo ""

# Iniciar servidor
python app.py
