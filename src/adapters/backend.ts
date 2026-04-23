import axios from "axios";


export interface Task {
    name_template: string,
    dados: LeadRegister,
    phoneNumberId: string
}

export interface LeadRegister {
    nome: string,
    email?: string,
    produto?: string,
    contexto?: string,
    tomLead?: string,
    urgenciaLead?: string,
    instrucao?: string,
    telefone: string,
    nomeAgente: string,
    telefoneAgente: string,
    problema?: string,
    etapa?: string,
}


export interface Metadata {
    display_phone_number: string
    phone_number_id: string
}
