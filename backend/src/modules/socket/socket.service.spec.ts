import { SocketService } from './socket.service';

describe('SocketService', () => {
  let service: SocketService;
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  const rooms = new Map<string, Set<string>>();

  beforeEach(() => {
    service = new SocketService();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does nothing without a socket server and reports offline', () => {
    service.emitToUser(1, 'EVENT', {});
    service.emitToAll('EVENT', {});

    expect(service.isUserOnline(1)).toBe(false);
  });

  it('emits to a user room and all clients', () => {
    service.socketServer = {
      to,
      emit,
      sockets: { adapter: { rooms } },
    } as any;

    service.emitToUser(7, 'UPDATED', { id: 1 });
    service.emitToAll('GLOBAL', { ok: true });

    expect(to).toHaveBeenCalledWith('user_7');
    expect(emit).toHaveBeenCalledWith('UPDATED', { id: 1 });
    expect(emit).toHaveBeenCalledWith('GLOBAL', { ok: true });
  });

  it('checks whether the user room has connected sockets', () => {
    service.socketServer = {
      sockets: { adapter: { rooms } },
    } as any;
    rooms.set('user_7', new Set(['socket']));

    expect(service.isUserOnline(7)).toBe(true);
    expect(service.isUserOnline(8)).toBe(false);
  });
});
