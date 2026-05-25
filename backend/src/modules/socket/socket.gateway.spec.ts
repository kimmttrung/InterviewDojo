import { Test } from '@nestjs/testing';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

describe('SocketGateway', () => {
  let gateway: SocketGateway;
  const socketService = { socketServer: undefined };
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  const client = {
    id: 'socket-1',
    handshake: { query: { userId: '7' } },
    join: jest.fn(),
    disconnect: jest.fn(),
    to,
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SocketGateway,
        { provide: SocketService, useValue: socketService },
      ],
    }).compile();
    gateway = moduleRef.get(SocketGateway);
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publishes the initialized server to SocketService', () => {
    const server = {} as any;

    gateway.afterInit(server);

    expect(socketService.socketServer).toBe(server);
  });

  it('joins authenticated users to their own room and disconnects anonymous users', () => {
    gateway.handleConnection(client as any);
    expect(client.join).toHaveBeenCalledWith('user_7');
    expect(client.disconnect).not.toHaveBeenCalled();

    gateway.handleConnection({
      ...client,
      handshake: { query: { userId: 'undefined' } },
    } as any);
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('joins interview rooms and broadcasts collaboration events', () => {
    gateway.handleJoinRoom(client as any, 'room-1');
    gateway.handleCodeChange(client as any, { roomId: 'room-1', code: 'code' });
    gateway.handleRunResult(
      { roomId: 'room-1', result: { stdout: 'ok' } },
      client as any,
    );
    gateway.handleLanguageChange(client as any, {
      roomId: 'room-1',
      languageId: '71',
    });
    gateway.handleQuestionChange(client as any, {
      roomId: 'room-1',
      question: { title: 'Question' },
      mode: 'code',
    });

    expect(client.join).toHaveBeenCalledWith('room-1');
    expect(emit).toHaveBeenCalledWith('receive_code', 'code');
    expect(emit).toHaveBeenCalledWith('receive_run_result', { stdout: 'ok' });
    expect(emit).toHaveBeenCalledWith('receive_language', '71');
    expect(emit).toHaveBeenCalledWith('receive_question', {
      question: { title: 'Question' },
      mode: 'code',
    });
  });

  it('broadcasts work mode, whiteboard, submit result and filter changes', () => {
    gateway.handleWorkModeChange(client as any, {
      roomId: 'room-1',
      mode: 'whiteboard',
    });
    gateway.handleWhiteboardDraw(client as any, {
      roomId: 'room-1',
      shapes: [{ id: 1 }],
    });
    gateway.handleClearWhiteboard(client as any, 'room-1');
    gateway.handleSubmitResult(client as any, {
      roomId: 'room-1',
      result: 'accepted',
    });
    gateway.handleUpdateFilters(client as any, {
      roomId: 'room-1',
      type: 'CODING',
      difficulty: 'EASY',
    });

    expect(emit).toHaveBeenCalledWith('receive_work_mode', 'whiteboard');
    expect(emit).toHaveBeenCalledWith('receive_whiteboard_shapes', [{ id: 1 }]);
    expect(emit).toHaveBeenCalledWith('receive_clear_whiteboard');
    expect(emit).toHaveBeenCalledWith('receive_submit_result', 'accepted');
    expect(emit).toHaveBeenCalledWith('sync_filters', {
      type: 'CODING',
      difficulty: 'EASY',
    });
  });
});
