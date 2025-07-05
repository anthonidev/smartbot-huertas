import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContextBase } from './entities/context-base.entity';
import { CreateContextBaseDto } from './dto/create-base-context.dto';
import { CreateQuickHelpDto } from './dto/create-quick-help.dto';
import { QuickHelp } from './entities/quick-help.entity';
import { SystemGuide } from './entities/system-guide.entity';
import { CreateSystemGuideDto } from './dto/create-system-guide.dto';
import { RoleContext } from './entities/role-context.entity';
import { CreateRoleContextDto } from './dto/create-role-context.dto';
import { RoleUser } from 'src/common/interfaces/user.interface';
import { DatabaseAccess } from './entities/database.entity';
import { CreateDatabaseAccessDto } from './dto/create-database-context.dto';

@Injectable()
export class ContextService {
  constructor(
    @InjectModel(ContextBase.name)
    private readonly contextBaseModel: Model<ContextBase>,
    @InjectModel(QuickHelp.name)
    private readonly quickHelpModel: Model<QuickHelp>,
    @InjectModel(SystemGuide.name)
    private readonly systemGuideModel: Model<SystemGuide>,
    @InjectModel(RoleContext.name)
    private readonly roleContextModel: Model<RoleContext>,
    @InjectModel(DatabaseAccess.name)
    private readonly databaseAccessModel: Model<DatabaseAccess>,
  ) {}

  async createContextBase(createContextBaseDto: CreateContextBaseDto) {
    try {
      const { key, value, isActive = true, description } = createContextBaseDto;

      // Buscar si ya existe un registro con la misma key
      const existingContext = await this.contextBaseModel.findOne({ key });

      if (existingContext) {
        // Si existe, actualizar con los nuevos valores
        existingContext.value = value;
        existingContext.isActive = isActive;
        if (description !== undefined) {
          existingContext.description = description;
        }

        const updatedContext = await existingContext.save();

        return {
          success: true,
          message: `Context base con key '${key}' actualizado exitosamente`,
          data: updatedContext,
          action: 'updated',
        };
      } else {
        // Si no existe, crear nuevo registro
        const newContext = new this.contextBaseModel({
          key,
          value,
          isActive,
          description,
        });

        const savedContext = await newContext.save();

        return {
          success: true,
          message: `Context base con key '${key}' creado exitosamente`,
          data: savedContext,
          action: 'created',
        };
      }
    } catch (error) {
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al crear/actualizar context base',
        error: error.message,
      });
    }
  }

  async getContextBaseByKey(key: string): Promise<ContextBase | null> {
    return this.contextBaseModel.findOne({ key, isActive: true });
  }

  async getAllActiveContextBase(): Promise<ContextBase[]> {
    return this.contextBaseModel.find({ isActive: true });
  }

  async createQuickHelp(createQuickHelpDto: CreateQuickHelpDto) {
    try {
      const { roleCode, questions, keywords } = createQuickHelpDto;

      // Eliminar todas las preguntas existentes para este rol
      await this.quickHelpModel.deleteMany({ roleCode });

      // Crear las nuevas preguntas
      const quickHelpData = questions.map((question, index) => ({
        roleCode,
        question,
        order: index + 1,
        keywords: keywords || [],
        isActive: true,
      }));

      const createdQuickHelp =
        await this.quickHelpModel.insertMany(quickHelpData);

      return {
        success: true,
        message: `Quick Help para rol '${roleCode}' creado exitosamente`,
        data: {
          roleCode,
          questionsCount: createdQuickHelp.length,
          questions: createdQuickHelp.map((qh) => ({
            id: qh._id,
            question: qh.question,
            order: qh.order,
          })),
        },
        action: 'created',
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al crear Quick Help',
        error: error.message,
      });
    }
  }

  async getQuickHelpByRole(roleCode: string): Promise<QuickHelp[]> {
    return this.quickHelpModel
      .find({ roleCode, isActive: true })
      .sort({ order: 1 });
  }

  async createSystemGuide(createSystemGuideDto: CreateSystemGuideDto) {
    try {
      const {
        guideKey,
        title,
        applicableRoles,
        steps,
        description,
        metadata,
        priority = 0,
      } = createSystemGuideDto;

      // Buscar si ya existe una guía con la misma guideKey
      const existingGuide = await this.systemGuideModel.findOne({ guideKey });

      if (existingGuide) {
        // Si existe, actualizar con los nuevos valores
        existingGuide.title = title;
        existingGuide.applicableRoles = applicableRoles;
        existingGuide.steps = steps;
        existingGuide.priority = priority;
        if (description !== undefined) {
          existingGuide.description = description;
        }
        if (metadata !== undefined) {
          existingGuide.metadata = metadata;
        }

        const updatedGuide = await existingGuide.save();

        return {
          success: true,
          message: `System Guide con key '${guideKey}' actualizado exitosamente`,
          data: {
            id: updatedGuide._id,
            guideKey: updatedGuide.guideKey,
            title: updatedGuide.title,
            applicableRoles: updatedGuide.applicableRoles,
            stepsCount: updatedGuide.steps.length,
            priority: updatedGuide.priority,
          },
          action: 'updated',
        };
      } else {
        // Si no existe, crear nueva guía
        const newGuide = new this.systemGuideModel({
          guideKey,
          title,
          applicableRoles,
          steps,
          description,
          metadata,
          priority,
          isActive: true,
        });

        const savedGuide = await newGuide.save();

        return {
          success: true,
          message: `System Guide con key '${guideKey}' creado exitosamente`,
          data: {
            id: savedGuide._id,
            guideKey: savedGuide.guideKey,
            title: savedGuide.title,
            applicableRoles: savedGuide.applicableRoles,
            stepsCount: savedGuide.steps.length,
            priority: savedGuide.priority,
          },
          action: 'created',
        };
      }
    } catch (error) {
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al crear/actualizar System Guide',
        error: error.message,
      });
    }
  }

  async getSystemGuidesByRole(roleCode: string): Promise<SystemGuide[]> {
    return this.systemGuideModel
      .find({
        applicableRoles: { $in: [roleCode, 'ALL'] },
        isActive: true,
      })
      .sort({ priority: -1, title: 1 });
  }

  async getSystemGuideByKey(guideKey: string): Promise<SystemGuide | null> {
    return this.systemGuideModel.findOne({ guideKey, isActive: true });
  }

  async createRoleContext(createRoleContextDto: CreateRoleContextDto) {
    try {
      const {
        roleCode,
        name,
        description,
        capabilities,
        commonQueries,
        workflows,
        metadata,
        isActive = true,
      } = createRoleContextDto;

      // Buscar si ya existe un contexto para este rol
      const existingRoleContext = await this.roleContextModel.findOne({
        roleCode,
      });

      if (existingRoleContext) {
        // Si existe, actualizar con los nuevos valores
        existingRoleContext.name = name;
        existingRoleContext.description = description;
        existingRoleContext.capabilities = capabilities;
        existingRoleContext.commonQueries = commonQueries;
        existingRoleContext.workflows = workflows;
        existingRoleContext.isActive = isActive;
        if (metadata !== undefined) {
          existingRoleContext.metadata = metadata;
        }

        const updatedRoleContext = await existingRoleContext.save();

        return {
          success: true,
          message: `Role Context para rol '${roleCode}' actualizado exitosamente`,
          data: {
            id: updatedRoleContext._id,
            roleCode: updatedRoleContext.roleCode,
            name: updatedRoleContext.name,
            description: updatedRoleContext.description,
            capabilitiesCount: updatedRoleContext.capabilities.length,
            commonQueriesCount: updatedRoleContext.commonQueries.length,
            workflowsCount: updatedRoleContext.workflows.length,
            isActive: updatedRoleContext.isActive,
          },
          action: 'updated',
        };
      } else {
        // Si no existe, crear nuevo contexto de rol
        const newRoleContext = new this.roleContextModel({
          roleCode,
          name,
          description,
          capabilities,
          commonQueries,
          workflows,
          metadata,
          isActive,
        });

        const savedRoleContext = await newRoleContext.save();

        return {
          success: true,
          message: `Role Context para rol '${roleCode}' creado exitosamente`,
          data: {
            id: savedRoleContext._id,
            roleCode: savedRoleContext.roleCode,
            name: savedRoleContext.name,
            description: savedRoleContext.description,
            capabilitiesCount: savedRoleContext.capabilities.length,
            commonQueriesCount: savedRoleContext.commonQueries.length,
            workflowsCount: savedRoleContext.workflows.length,
            isActive: savedRoleContext.isActive,
          },
          action: 'created',
        };
      }
    } catch (error) {
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al crear/actualizar Role Context',
        error: error.message,
      });
    }
  }

  async getRoleContextByCode(roleCode: string): Promise<RoleContext | null> {
    return this.roleContextModel.findOne({ roleCode, isActive: true });
  }

  async getAllActiveRoleContexts(): Promise<RoleContext[]> {
    return this.roleContextModel.find({ isActive: true });
  }

  // ============ NUEVOS MÉTODOS PARA LOS MESSAGE PATTERNS ============

  /**
   * Obtener ayuda rápida personalizada por rol
   */
  async getQuickHelpForUser(role: RoleUser) {
    try {
      const helpQuestions = await this.quickHelpModel
        .find({ roleCode: role.code, isActive: true })
        .sort({ order: 1 })
        .select('question order')
        .lean();

      // Transformar _id a id
      const transformedQuestions = helpQuestions.map((question) => ({
        id: question._id,
        question: question.question,
        order: question.order,
      }));

      return {
        success: true,
        help: transformedQuestions,
        userRole: {
          code: role.code,
          name: role.name,
        },
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al obtener ayuda rápida',
        error: error.message,
      });
    }
  }
  /**
   * Obtener guía paso a paso específica
   */
  async getGuideByKey(guideKey: string, role: RoleUser) {
    try {
      const guide = await this.systemGuideModel
        .findOne({
          guideKey,
          applicableRoles: { $in: [role.code, 'ALL'] },
          isActive: true,
        })
        .select('guideKey title description steps  -_id')
        .lean();

      if (!guide) {
        throw new RpcException({
          status: 404,
          success: false,
          message: `Guía '${guideKey}' no encontrada o no disponible para el rol ${role.code}`,
        });
      }

      return {
        success: true,
        guide,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al obtener la guía',
        error: error.message,
      });
    }
  }

  /**
   * Obtener lista de guías disponibles para el rol del usuario
   */
  async getAvailableGuidesForUser(role: RoleUser) {
    try {
      const guides = await this.systemGuideModel
        .find({
          applicableRoles: { $in: [role.code, 'ALL'] },
          isActive: true,
        })
        .select('guideKey title description -_id')
        .sort({ priority: -1, title: 1 })
        .lean();

      return {
        success: true,
        guides,
        userRole: {
          code: role.code,
          name: role.name,
        },
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al obtener las guías disponibles',
        error: error.message,
      });
    }
  }

  async createDatabaseAccess(createDatabaseAccessDto: CreateDatabaseAccessDto) {
    try {
      const {
        roleCode,
        roleName,
        allowedTables,
        databaseSchema,
        restrictedColumns,
        allowedOperations,
        queryLimits,
        isActive = true,
      } = createDatabaseAccessDto;

      // Buscar si ya existe configuración para este rol
      const existingAccess = await this.databaseAccessModel.findOne({
        roleCode,
      });

      if (existingAccess) {
        // Si existe, actualizar con los nuevos valores
        existingAccess.roleName = roleName;
        existingAccess.allowedTables = allowedTables;
        existingAccess.databaseSchema = databaseSchema;
        existingAccess.restrictedColumns = restrictedColumns;
        existingAccess.allowedOperations = allowedOperations;
        existingAccess.queryLimits = queryLimits;
        existingAccess.isActive = isActive;

        const updatedAccess = await existingAccess.save();

        return {
          success: true,
          message: `Database Access para rol '${roleCode}' actualizado exitosamente`,
          data: {
            id: updatedAccess._id,
            roleCode: updatedAccess.roleCode,
            roleName: updatedAccess.roleName,
            allowedTablesCount: updatedAccess.allowedTables.length,
            allowedOperations: updatedAccess.allowedOperations,
            isActive: updatedAccess.isActive,
          },
          action: 'updated',
        };
      } else {
        // Si no existe, crear nueva configuración
        const newAccess = new this.databaseAccessModel({
          roleCode,
          roleName,
          allowedTables,
          databaseSchema,
          restrictedColumns,
          allowedOperations,
          queryLimits,
          isActive,
        });

        const savedAccess = await newAccess.save();

        return {
          success: true,
          message: `Database Access para rol '${roleCode}' creado exitosamente`,
          data: {
            id: savedAccess._id,
            roleCode: savedAccess.roleCode,
            roleName: savedAccess.roleName,
            allowedTablesCount: savedAccess.allowedTables.length,
            allowedOperations: savedAccess.allowedOperations,
            isActive: savedAccess.isActive,
          },
          action: 'created',
        };
      }
    } catch (error) {
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al crear/actualizar Database Access',
        error: error.message,
      });
    }
  }

  async getDatabaseAccessByRole(roleCode: string) {
    try {
      const access = await this.databaseAccessModel
        .findOne({ roleCode, isActive: true })
        .lean();

      if (!access) {
        throw new RpcException({
          status: 404,
          success: false,
          message: `No se encontró configuración de acceso para el rol '${roleCode}'`,
        });
      }

      return {
        success: true,
        data: access,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al obtener configuración de acceso',
        error: error.message,
      });
    }
  }
}
