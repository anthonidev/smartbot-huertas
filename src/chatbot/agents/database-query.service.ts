import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { ClaudeApiService } from '../../claude-api/claude-api.service';
import { DatabaseAccess } from '../../context/entities/database.entity';
import { envs } from '../../config/envs';

interface SQLQueryResult {
  success: boolean;
  sqlQuery?: string;
  message?: string;
}

interface QueryExecutionResult {
  success: boolean;
  data?: any[];
  message?: string;
}

@Injectable()
export class DatabaseQueryService {
  private readonly logger = new Logger(DatabaseQueryService.name);

  constructor(private readonly claudeApiService: ClaudeApiService) {}

  async generateSQLQuery(
    userQuestion: string,
    databaseAccess: DatabaseAccess,
  ): Promise<SQLQueryResult> {
    try {
      const sqlPrompt = this.buildSQLPrompt(userQuestion, databaseAccess);

      const response = await this.claudeApiService.sendMessage(
        [
          {
            role: 'user',
            content: sqlPrompt,
          },
        ],
        {
          model: 'claude-3-haiku-20240307',
          maxTokens: 500,
          temperature: 0.1,
        },
      );

      const cleanResponse = response.trim();
      this.logger.debug(`🔍 Respuesta del agente: ${cleanResponse}`);

      // Verificar si la respuesta indica falta de permisos
      if (
        cleanResponse.toLowerCase().includes('no tienes permisos') ||
        cleanResponse.toLowerCase().includes('sin permisos') ||
        cleanResponse.toLowerCase().includes('no autorizado') ||
        cleanResponse.toLowerCase().includes('no permitido')
      ) {
        return {
          success: false,
          message: 'No tienes permisos para realizar esta consulta.',
        };
      }

      // Verificar si la respuesta contiene una consulta SQL válida
      if (
        cleanResponse.toLowerCase().includes('select') ||
        cleanResponse.toLowerCase().includes('insert') ||
        cleanResponse.toLowerCase().includes('update') ||
        cleanResponse.toLowerCase().includes('delete')
      ) {
        // Extraer solo la consulta SQL
        const sqlQuery = this.extractSQLFromResponse(cleanResponse);

        this.logger.debug(`🔍 SQL generado: ${sqlQuery}`);

        return {
          success: true,
          sqlQuery,
        };
      }

      return {
        success: false,
        message: 'No se pudo generar una consulta SQL válida.',
      };
    } catch (error) {
      this.logger.error(`❌ Error generando SQL: ${error.message}`);
      return {
        success: false,
        message: 'Error al generar la consulta SQL.',
      };
    }
  }

  async executeQuery(sqlQuery: string): Promise<QueryExecutionResult> {
    const client = new Client({
      connectionString: envs.POSTGRES_URI,
    });

    try {
      await client.connect();

      // Validar que sea una consulta SELECT para seguridad
      const cleanQuery = sqlQuery.trim().toLowerCase();
      if (!cleanQuery.startsWith('select')) {
        return {
          success: false,
          message: 'Solo se permiten consultas SELECT.',
        };
      }

      const result = await client.query(sqlQuery);

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'No se encontraron resultados.',
        };
      }

      this.logger.debug(
        `✅ Query ejecutado exitosamente: ${result.rows.length} filas`,
      );

      return {
        success: true,
        data: result.rows,
      };
    } catch (error) {
      this.logger.error(`❌ Error ejecutando query: ${error.message}`);
      return {
        success: false,
        message: 'Error al ejecutar la consulta en la base de datos.',
      };
    } finally {
      await client.end();
    }
  }

  private buildSQLPrompt(
    userQuestion: string,
    databaseAccess: DatabaseAccess,
  ): string {
    const maxRows = databaseAccess.queryLimits?.maxRows || 100;
    const maxJoins = databaseAccess.queryLimits?.maxJoins || 3;

    return `Eres un asistente SQL especializado. Analiza la pregunta del usuario y genera una consulta SQL válida o indica si no tienes permisos.

ESQUEMA DE BASE DE DATOS:
${databaseAccess.databaseSchema}

CONFIGURACIÓN DE PERMISOS:
- Tablas permitidas: ${databaseAccess.allowedTables.join(', ')}
- Columnas restringidas: ${databaseAccess.restrictedColumns?.join(', ') || 'Ninguna'}
- Operaciones permitidas: ${databaseAccess.allowedOperations?.join(', ') || 'SELECT'}
- Límite de filas: ${maxRows}
- Límite de JOINs: ${maxJoins}

PREGUNTA DEL USUARIO: "${userQuestion}"

INSTRUCCIONES CRÍTICAS:
1. Si la pregunta requiere tablas que NO están en las tablas permitidas, responde EXACTAMENTE: "No tienes permisos para acceder a esas tablas"
2. Si la pregunta requiere operaciones no permitidas, responde EXACTAMENTE: "No tienes permisos para realizar esa operación"
3. Si la consulta es válida, genera SOLO la consulta SQL completa en una sola línea, sin explicaciones
4. Siempre incluye LIMIT ${maxRows} al final de las consultas SELECT
5. No uses más de ${maxJoins} JOINs
6. No incluyas columnas restringidas en el SELECT
7. Usa nombres de tabla y columna exactos del esquema
8. NO uses código markdown (${'```'}ql)

9. NO agregues explicaciones antes o después del SQL
10. La consulta debe estar completa en una sola respuesta

FORMATO DE RESPUESTA:
- Si hay permisos: Una sola línea con la consulta SQL completa
- Si no hay permisos: El mensaje de error exacto mencionado arriba

Ejemplo de respuesta válida:
SELECT columna1, columna2 FROM tabla WHERE condicion LIMIT ${maxRows};`;
  }

  private extractSQLFromResponse(response: string): string {
    // Limpiar la respuesta de posibles caracteres no deseados
    let cleanResponse = response.trim();

    // Remover markdown code blocks si existen
    cleanResponse = cleanResponse
      .replace(/```sql\n?/gi, '')
      .replace(/```\n?/g, '');

    // Buscar el inicio de la consulta SQL
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    let startIndex = -1;

    for (const kw of sqlKeywords) {
      const index = cleanResponse.toUpperCase().indexOf(kw);
      if (index !== -1 && (startIndex === -1 || index < startIndex)) {
        startIndex = index;
      }
    }

    if (startIndex === -1) {
      // Si no se encuentra palabra clave SQL, devolver la respuesta limpia
      return cleanResponse;
    }

    // Extraer desde la palabra clave hasta el final
    let sqlQuery = cleanResponse.substring(startIndex);

    // Limpiar líneas vacías y espacios extra
    sqlQuery = sqlQuery
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(' ');

    // Remover punto y coma final si existe para evitar duplicados
    sqlQuery = sqlQuery.replace(/;?\s*$/, '');

    // Asegurar que termina en punto y coma
    if (!sqlQuery.endsWith(';')) {
      sqlQuery += ';';
    }

    this.logger.debug(`🔧 SQL extraído y limpiado: ${sqlQuery}`);

    return sqlQuery;
  }
}
