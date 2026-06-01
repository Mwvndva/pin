import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const PinApp());
}

class PinApp extends StatelessWidget {
  const PinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.black,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.yellow,
          brightness: Brightness.dark,
        ),
        fontFamily: 'Roboto',
      ),
      home: const PinHome(),
    );
  }
}

class AppColors {
  static const black = Color(0xFF050505);
  static const white = Color(0xFFFFFFFF);
  static const panel = Color(0xFF1F1F1F);
  static const panel2 = Color(0xFF292929);
  static const muted = Color(0xFFA7A7A7);
  static const yellow = Color(0xFFFFCC00);
  static const orange = Color(0xFFFF981F);
  static const pink = Color(0xFFF45BB8);
  static const purple = Color(0xFF6017E8);
  static const green = Color(0xFFA8FF4F);
  static const red = Color(0xFFFF3035);
}

enum MainTab { pins, memories, settings }
enum MemoryMode { camera, browser }
enum MemoryAudience { public, friends }
enum PinAudience { friends, public }

class SocialPin {
  SocialPin({
    required this.id,
    required this.creatorId,
    required this.title,
    required this.area,
    required this.category,
    required this.time,
    required this.color,
    required this.latitude,
    required this.longitude,
    required this.pullingUp,
    required this.hasMemories,
    required this.audience,
    required this.reactions,
    required this.reactionCounts,
    this.unsafe = false,
    this.userReaction,
    this.userGoing = false,
  });

  final String id;
  final String creatorId;
  final String title;
  final String area;
  final String category;
  final String time;
  final Color color;
  final double latitude;
  final double longitude;
  int pullingUp;
  final bool hasMemories;
  final bool unsafe;
  final PinAudience audience;
  List<String> reactions;
  Map<String, int> reactionCounts;
  String? userReaction;
  bool userGoing;

  factory SocialPin.fromJson(Map<String, dynamic> json) {
    final colorValue = json['color'] as String? ?? '#ffcc00';
    final reactions = (json['reactions'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList();
    final rawCounts = json['reactionCounts'] as Map<String, dynamic>? ?? const {};
    return SocialPin(
      id: json['id'].toString(),
      creatorId: json['creatorId']?.toString() ?? 'user-current',
      title: json['title']?.toString() ?? 'Untitled pin',
      area: json['area']?.toString() ?? 'Nairobi',
      category: json['category']?.toString() ?? 'Pop-up',
      time: json['time']?.toString() ?? 'Now',
      color: parseHexColor(colorValue),
      latitude: (json['latitude'] as num?)?.toDouble() ?? -1.286,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 36.817,
      pullingUp: (json['pullingUp'] as num?)?.toInt() ?? (json['interested'] as num?)?.toInt() ?? 0,
      hasMemories: json['hasMemories'] == true,
      unsafe: json['unsafe'] == true,
      audience: json['audience'] == 'public' ? PinAudience.public : PinAudience.friends,
      reactions: reactions,
      reactionCounts: rawCounts.map((key, value) => MapEntry(key, (value as num?)?.toInt() ?? 0)),
      userReaction: json['userReaction']?.toString(),
      userGoing: json['userGoing'] == true,
    );
  }

  Map<String, dynamic> toCreateJson() => {
        'creatorId': creatorId,
        'title': title,
        'area': area,
        'category': category,
        'latitude': latitude,
        'longitude': longitude,
        'audience': audience == PinAudience.public ? 'public' : 'friends',
        'hasMemory': hasMemories,
      };
}

class MemoryItem {
  MemoryItem({
    required this.id,
    required this.owner,
    required this.age,
    required this.audience,
    this.friendStatus = FriendStatus.none,
    this.reacted = false,
  });

  final String id;
  final String owner;
  final String age;
  MemoryAudience audience;
  FriendStatus friendStatus;
  bool reacted;

  factory MemoryItem.fromJson(Map<String, dynamic> json) {
    final status = json['friendStatus']?.toString();
    return MemoryItem(
      id: json['id'].toString(),
      owner: json['owner']?.toString() ?? 'Pin user',
      age: json['age']?.toString() ?? 'now',
      audience: json['audience'] == 'friends' || json['audience'] == 'following'
          ? MemoryAudience.friends
          : MemoryAudience.public,
      friendStatus: status == 'friends'
          ? FriendStatus.friends
          : status == 'pending'
              ? FriendStatus.requested
              : FriendStatus.none,
      reacted: json['reacted'] == true,
    );
  }
}

enum FriendStatus { none, requested, friends }

Color parseHexColor(String value) {
  final normalized = value.replaceFirst('#', '');
  final hex = normalized.length == 6 ? 'ff$normalized' : normalized;
  return Color(int.parse(hex, radix: 16));
}

class PinApi {
  PinApi() : baseUrl = Platform.isAndroid ? 'http://10.0.2.2:3101' : 'http://127.0.0.1:3101';

  final String baseUrl;
  final _client = HttpClient()..connectionTimeout = const Duration(seconds: 3);

  Future<Map<String, dynamic>> getBootstrap() async {
    final request = await _client.getUrl(Uri.parse('$baseUrl/api/bootstrap'));
    request.headers.set(HttpHeaders.authorizationHeader, 'Bearer dev-token');
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('Bootstrap failed: ${response.statusCode}');
    }
    return jsonDecode(body) as Map<String, dynamic>;
  }

  Future<SocialPin> createPin(SocialPin pin) async {
    final request = await _client.postUrl(Uri.parse('$baseUrl/api/pins'));
    request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
    request.headers.set(HttpHeaders.authorizationHeader, 'Bearer dev-token');
    request.write(jsonEncode(pin.toCreateJson()));
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('Create pin failed: ${response.statusCode}');
    }
    return SocialPin.fromJson(jsonDecode(body) as Map<String, dynamic>);
  }

  Future<int> pullUp(String pinId) async {
    final response = await _post('/api/pins/$pinId/pull-up', {});
    return (response['pullingUp'] as num?)?.toInt() ?? 0;
  }

  Future<Map<String, dynamic>> reactToPin(String pinId, String emoji) {
    return _post('/api/pins/$pinId/reactions', {'emoji': emoji});
  }

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> payload) async {
    final request = await _client.postUrl(Uri.parse('$baseUrl$path'));
    request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
    request.headers.set(HttpHeaders.authorizationHeader, 'Bearer dev-token');
    request.write(jsonEncode(payload));
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw HttpException('$path failed: ${response.statusCode}');
    }
    return jsonDecode(body) as Map<String, dynamic>;
  }
}

class PinHome extends StatefulWidget {
  const PinHome({super.key});

  @override
  State<PinHome> createState() => _PinHomeState();
}

class _PinHomeState extends State<PinHome> {
  static const double currentLatitude = -1.286;
  static const double currentLongitude = 36.817;
  static const double memoryRadiusMeters = 150;

  MainTab tab = MainTab.pins;
  bool lightMode = false;
  bool creatingPin = false;
  bool pinMemoryCaptured = false;
  bool draftPublicPin = false;
  SocialPin? memoryTargetPin;
  int streakDays = 4;
  final api = PinApi();
  String syncLabel = 'Offline preview';

  late List<SocialPin> pins = <SocialPin>[
    SocialPin(
      id: 'westlands',
      creatorId: 'user-nia',
      title: 'Westlands rooftop',
      area: 'Westlands',
      category: 'Live music',
      time: 'Live now',
      color: AppColors.yellow,
      latitude: -1.264,
      longitude: 36.803,
      pullingUp: 48,
      hasMemories: true,
      audience: PinAudience.friends,
      reactions: const ['🔥', '🎵', '😍'],
      reactionCounts: {'🔥': 8, '🎵': 5, '😍': 3},
    ),
    SocialPin(
      id: 'kilimani',
      creatorId: 'user-zuri',
      title: 'Kilimani brunch',
      area: 'Kilimani',
      category: 'Food',
      time: 'Live now',
      color: AppColors.pink,
      latitude: -1.292,
      longitude: 36.787,
      pullingUp: 22,
      hasMemories: true,
      audience: PinAudience.public,
      reactions: const ['😋', '✨', '🥂'],
      reactionCounts: {'😋': 6, '✨': 4, '🥂': 2},
    ),
    SocialPin(
      id: 'cbd',
      creatorId: 'user-amani',
      title: 'CBD games night',
      area: 'CBD',
      category: 'Games',
      time: 'Live now',
      color: AppColors.green,
      latitude: -1.286,
      longitude: 36.817,
      pullingUp: 17,
      hasMemories: true,
      audience: PinAudience.public,
      reactions: const ['🎮', '🔥', '😄'],
      reactionCounts: {'🎮': 3, '🔥': 4, '😄': 2},
    ),
  ];

  late List<MemoryItem> memories = <MemoryItem>[
    MemoryItem(id: 'zuri', owner: 'Zuri', age: '12m', audience: MemoryAudience.public),
    MemoryItem(
      id: 'nia',
      owner: 'Nia',
      age: '6h',
      audience: MemoryAudience.friends,
      friendStatus: FriendStatus.friends,
    ),
  ];

  @override
  void initState() {
    super.initState();
    loadBackendData();
  }

  Future<void> loadBackendData() async {
    try {
      final payload = await api.getBootstrap();
      if (!mounted) return;
      setState(() {
        pins = (payload['pins'] as List<dynamic>? ?? const [])
            .map((item) => SocialPin.fromJson(item as Map<String, dynamic>))
            .where((pin) => pin.hasMemories)
            .toList();
        memories = (payload['memories'] as List<dynamic>? ?? const [])
            .map((item) => MemoryItem.fromJson(item as Map<String, dynamic>))
            .toList();
        streakDays = ((payload['streak'] as Map<String, dynamic>?)?['days'] as num?)?.toInt() ?? streakDays;
        syncLabel = 'Live backend';
      });
    } catch (error) {
      if (kDebugMode) {
        debugPrint('Using local Flutter preview data: $error');
      }
      if (mounted) setState(() => syncLabel = 'Offline preview');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppThemeColors(lightMode);
    return Scaffold(
      backgroundColor: colors.shell,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 12),
          child: Stack(
            children: [
              Positioned.fill(
                bottom: 82,
                child: switch (tab) {
                  MainTab.pins => PinsView(
                      pins: pins,
                      colors: colors,
                      streakDays: streakDays,
                      syncLabel: syncLabel,
                      api: api,
                      onPinChanged: () => setState(() {}),
                      onStartCreatePin: startCreatePin,
                      onAddMemoryToPin: startAddMemoryToPin,
                    ),
                  MainTab.memories => MemoriesView(
                      memories: memories,
                      colors: colors,
                      creatingPin: creatingPin,
                      memoryTargetPin: memoryTargetPin,
                      pinMemoryCaptured: pinMemoryCaptured,
                      draftPublicPin: draftPublicPin,
                      onCapturePinMemory: () => setState(() => pinMemoryCaptured = true),
                      onCaptureExistingPinMemory: captureMemoryForPin,
                      onTogglePinAudience: () => setState(() => draftPublicPin = !draftPublicPin),
                      onCancelPinCreation: cancelCreatePin,
                      onPublishPin: publishDraftPin,
                      onFriendChanged: () => setState(() {}),
                      onReaction: () => setState(() => streakDays += 1),
                    ),
                  MainTab.settings => SettingsView(
                      colors: colors,
                      lightMode: lightMode,
                      onToggleTheme: () => setState(() => lightMode = !lightMode),
                    ),
                },
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: BottomNav(
                  selected: tab,
                  colors: colors,
                  onSelect: (next) => setState(() {
                    tab = next;
                    if (next != MainTab.memories) {
                      creatingPin = false;
                      pinMemoryCaptured = false;
                      draftPublicPin = false;
                      memoryTargetPin = null;
                    }
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void startCreatePin() {
    setState(() {
      tab = MainTab.memories;
      creatingPin = true;
      memoryTargetPin = null;
      pinMemoryCaptured = false;
      draftPublicPin = false;
    });
  }

  void cancelCreatePin() {
    setState(() {
      creatingPin = false;
      pinMemoryCaptured = false;
      draftPublicPin = false;
      memoryTargetPin = null;
    });
  }

  void startAddMemoryToPin(SocialPin pin) {
    final distance = distanceMeters(currentLatitude, currentLongitude, pin.latitude, pin.longitude);
    if (distance > memoryRadiusMeters) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Move closer to this pin to add a memory. You need to be within ${memoryRadiusMeters.round()}m.')),
      );
      return;
    }
    setState(() {
      tab = MainTab.memories;
      creatingPin = false;
      pinMemoryCaptured = false;
      draftPublicPin = false;
      memoryTargetPin = pin;
    });
  }

  double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
    const earthRadius = 6371000.0;
    final dLat = (lat2 - lat1) * math.pi / 180;
    final dLon = (lon2 - lon1) * math.pi / 180;
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * math.pi / 180) * math.cos(lat2 * math.pi / 180) *
            math.sin(dLon / 2) * math.sin(dLon / 2);
    return earthRadius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }

  void captureMemoryForPin() {
    final pin = memoryTargetPin;
    if (pin == null) return;
    setState(() {
      memories.insert(0, MemoryItem(
        id: 'memory-${DateTime.now().millisecondsSinceEpoch}',
        owner: 'You',
        age: 'now',
        audience: pin.audience == PinAudience.public ? MemoryAudience.public : MemoryAudience.friends,
        friendStatus: FriendStatus.friends,
      ));
      memoryTargetPin = null;
      tab = MainTab.pins;
    });
  }

  Future<void> publishDraftPin() async {
    if (!pinMemoryCaptured) return;
    final draft = SocialPin(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      creatorId: 'user-current',
      title: 'New hangout',
      area: 'Nairobi',
      category: 'Pop-up',
      time: 'Live now',
      color: AppColors.yellow,
      latitude: -1.286,
      longitude: 36.817,
      pullingUp: 1,
      hasMemories: true,
      audience: draftPublicPin ? PinAudience.public : PinAudience.friends,
      reactions: const [],
      reactionCounts: {},
    );
    try {
      final created = await api.createPin(draft);
      setState(() => pins.add(created));
    } catch (_) {
      setState(() => pins.add(draft));
    }
    setState(() {
      creatingPin = false;
      pinMemoryCaptured = false;
      draftPublicPin = false;
      tab = MainTab.pins;
    });
  }
}

class AppThemeColors {
  AppThemeColors(this.light);
  final bool light;

  Color get shell => light ? AppColors.white : AppColors.black;
  Color get panel => light ? const Color(0xFFF4F4F4) : AppColors.panel;
  Color get panel2 => light ? const Color(0xFFE8E8E8) : AppColors.panel2;
  Color get text => light ? AppColors.black : AppColors.white;
  Color get muted => light ? const Color(0xFF5F5F5F) : AppColors.muted;
}

class PinsView extends StatefulWidget {
  const PinsView({
    super.key,
    required this.pins,
    required this.colors,
    required this.streakDays,
    required this.syncLabel,
    required this.api,
    required this.onPinChanged,
    required this.onStartCreatePin,
    required this.onAddMemoryToPin,
  });

  final List<SocialPin> pins;
  final AppThemeColors colors;
  final int streakDays;
  final String syncLabel;
  final PinApi api;
  final VoidCallback onPinChanged;
  final VoidCallback onStartCreatePin;
  final ValueChanged<SocialPin> onAddMemoryToPin;

  @override
  State<PinsView> createState() => _PinsViewState();
}

class _PinsViewState extends State<PinsView> {
  SocialPin? selectedPin;
  Offset mapOffset = Offset.zero;
  final reactionOptions = const ['🔥', '🎵', '😍', '😬'];

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    return Stack(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Streak', style: TextStyle(color: colors.muted, fontWeight: FontWeight.w800, fontSize: 11)),
                    const SizedBox(height: 4),
                    Container(
                      height: 34,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(color: colors.panel, borderRadius: BorderRadius.circular(999)),
                      child: Row(
                        children: [
                          const Icon(Icons.local_fire_department, color: AppColors.orange, size: 18),
                          const SizedBox(width: 5),
                          Text('${widget.streakDays} days', style: TextStyle(color: colors.text, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                RoundButton(
                  colors: colors,
                  icon: Icons.add,
                  onTap: widget.onStartCreatePin,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: ['Now', 'Friends', 'Public'].map((filter) {
                final active = filter == 'Now';
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChipPill(
                    text: filter,
                    active: active,
                    colors: colors,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => selectedPin = null),
                onPanUpdate: (details) {
                  if (selectedPin != null) return;
                  setState(() {
                    mapOffset = Offset(
                      (mapOffset.dx + details.delta.dx).clamp(-130.0, 130.0),
                      (mapOffset.dy + details.delta.dy).clamp(-160.0, 160.0),
                    );
                  });
                },
                child: Container(
                  width: double.infinity,
                  clipBehavior: Clip.hardEdge,
                  decoration: BoxDecoration(color: colors.panel, borderRadius: BorderRadius.circular(30)),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: Transform.translate(
                          offset: mapOffset,
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              const Positioned.fill(child: MapGrid()),
                              Positioned(top: 22, left: 20, child: AreaLabel(text: 'Westlands', colors: colors)),
                              Positioned(bottom: 112, left: 50, child: AreaLabel(text: 'CBD', colors: colors)),
                              ...widget.pins.asMap().entries.map((entry) {
                                final position = pinPositionFor(entry.key);
                                return PinMarker(
                                  pin: entry.value,
                                  left: position.$1,
                                  top: position.$2,
                                  onTap: selectPin,
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                      if (selectedPin != null) PinPopup(
                        pin: selectedPin!,
                        colors: colors,
                        reactions: reactionOptions,
                        onClose: () => setState(() => selectedPin = null),
                        onAddMemory: () => widget.onAddMemoryToPin(selectedPin!),
                        onDelete: () => setState(() {
                          widget.pins.removeWhere((pin) => pin.id == selectedPin!.id);
                          selectedPin = null;
                          widget.onPinChanged();
                        }),
                        onPullUp: () async {
                          if (selectedPin!.userGoing) {
                            setState(() {
                              selectedPin!.userGoing = false;
                              selectedPin!.pullingUp = (selectedPin!.pullingUp - 1).clamp(0, 9999);
                            });
                            return;
                          }
                          try {
                            final count = await widget.api.pullUp(selectedPin!.id);
                            setState(() {
                              selectedPin!.pullingUp = count;
                              selectedPin!.userGoing = true;
                            });
                          } catch (_) {
                            setState(() {
                              selectedPin!.pullingUp += 1;
                              selectedPin!.userGoing = true;
                            });
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  (double, double) pinPositionFor(int index) {
    const positions = <(double, double)>[
      (.58, .18),
      (.18, .46),
      (.72, .58),
      (.42, .76),
      (.28, .25),
      (.60, .42),
    ];
    return positions[index % positions.length];
  }

  void selectPin(SocialPin pin) {
    setState(() => selectedPin = pin);
  }
}

class PinMarker extends StatelessWidget {
  const PinMarker({super.key, required this.pin, required this.left, required this.top, required this.onTap});
  final SocialPin pin;
  final double left;
  final double top;
  final ValueChanged<SocialPin> onTap;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Positioned(
          left: (constraints.maxWidth * left).clamp(18.0, constraints.maxWidth - 70),
          top: (constraints.maxHeight * top).clamp(56.0, constraints.maxHeight - 84),
          child: GestureDetector(
            onTap: () => onTap(pin),
            child: Column(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: pin.color,
                    border: Border.all(color: AppColors.black, width: 3),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(28),
                      topRight: Radius.circular(28),
                      bottomLeft: Radius.circular(28),
                    ),
                  ),
                  transform: Matrix4.rotationZ(.78),
                  child: Center(
                    child: Transform.rotate(
                      angle: -.78,
                      child: Text('${pin.pullingUp}', semanticsLabel: '${pin.pullingUp} people at this pin', style: TextStyle(color: pin.color == AppColors.purple ? AppColors.white : AppColors.black, fontWeight: FontWeight.w900, fontSize: 18)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class MapGrid extends StatelessWidget {
  const MapGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _MapGridPainter());
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: .035)
      ..strokeWidth = 1;
    for (double x = 42; x < size.width; x += 56) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 48; y < size.height; y += 58) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final roadPaint = Paint()
      ..color = Colors.white.withValues(alpha: .12)
      ..strokeWidth = 1.4
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..moveTo(size.width * .10, size.height * .88)
      ..lineTo(size.width * .34, size.height * .58)
      ..lineTo(size.width * .48, size.height * .28)
      ..lineTo(size.width * .62, size.height * .10);
    canvas.drawPath(path, roadPaint);
    canvas.drawLine(
      Offset(size.width * .08, size.height * .42),
      Offset(size.width * .88, size.height * .22),
      roadPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class PinPopup extends StatelessWidget {
  const PinPopup({
    super.key,
    required this.pin,
    required this.colors,
    required this.reactions,
    required this.onClose,
    required this.onAddMemory,
    required this.onDelete,
    required this.onPullUp,
  });

  final SocialPin pin;
  final AppThemeColors colors;
  final List<String> reactions;
  final VoidCallback onClose;
  final VoidCallback onAddMemory;
  final VoidCallback onDelete;
  final VoidCallback onPullUp;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 275,
        height: pin.hasMemories ? 355 : 220,
        decoration: BoxDecoration(
          color: const Color(0xFF202020),
          border: Border.all(color: pin.color, width: 3),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Stack(
          children: [
            if (pin.hasMemories) const Center(child: PhotoSilhouette()),
            Positioned(
              top: 12,
              left: 12,
              child: Row(
                children: [
                  DarkPill(text: pin.audience == PinAudience.public ? 'Public' : 'Friends'),
                  if (pin.unsafe) const Padding(
                    padding: EdgeInsets.only(left: 6),
                    child: DangerPill(text: 'Marked unsafe'),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 10,
              right: 10,
              child: GestureDetector(
                onTap: onClose,
                child: const CircleAvatar(radius: 15, backgroundColor: Color(0x99000000), child: Icon(Icons.close, color: AppColors.white, size: 18)),
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: pin.hasMemories ? 2 : 10,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (pin.hasMemories && pin.reactions.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 3),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: pin.reactions.take(3).map((emoji) => Container(
                          width: 22,
                          height: 22,
                          margin: const EdgeInsets.only(bottom: 4),
                          alignment: Alignment.center,
                          decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
                          child: Text(emoji, style: const TextStyle(fontSize: 12)),
                        )).toList(),
                      ),
                    ),
                  Row(
                    children: [
                      Text('${pin.pullingUp} pulling up now', style: const TextStyle(color: AppColors.white, fontSize: 10)),
                      const Spacer(),
                      SmallAction(label: pin.userGoing ? "Going" : "I'm going", active: pin.userGoing, onTap: onPullUp),
                      SmallIcon(icon: Icons.add, color: AppColors.orange, onTap: onAddMemory),
                      if (pin.creatorId == 'user-current') SmallIcon(icon: Icons.delete_outline, color: AppColors.red, onTap: onDelete),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class MemoriesView extends StatefulWidget {
  const MemoriesView({
    super.key,
    required this.memories,
    required this.colors,
    required this.creatingPin,
    required this.memoryTargetPin,
    required this.pinMemoryCaptured,
    required this.draftPublicPin,
    required this.onCapturePinMemory,
    required this.onCaptureExistingPinMemory,
    required this.onTogglePinAudience,
    required this.onCancelPinCreation,
    required this.onPublishPin,
    required this.onFriendChanged,
    required this.onReaction,
  });
  final List<MemoryItem> memories;
  final AppThemeColors colors;
  final bool creatingPin;
  final SocialPin? memoryTargetPin;
  final bool pinMemoryCaptured;
  final bool draftPublicPin;
  final VoidCallback onCapturePinMemory;
  final VoidCallback onCaptureExistingPinMemory;
  final VoidCallback onTogglePinAudience;
  final VoidCallback onCancelPinCreation;
  final VoidCallback onPublishPin;
  final VoidCallback onFriendChanged;
  final VoidCallback onReaction;

  @override
  State<MemoriesView> createState() => _MemoriesViewState();
}

class _MemoriesViewState extends State<MemoriesView> {
  MemoryAudience audience = MemoryAudience.public;
  int index = 0;
  int reactionIndex = 0;
  final reactions = const ['♡', '🔥', '😂', '😍', '🎵'];

  List<MemoryItem> get visible {
    return widget.memories.where((memory) {
      if (audience == MemoryAudience.friends) return memory.friendStatus == FriendStatus.friends;
      return memory.audience == MemoryAudience.public && memory.friendStatus != FriendStatus.friends;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;
    final addingMemory = widget.memoryTargetPin != null;
    final contextualCamera = widget.creatingPin || addingMemory;
    final effectiveMode = contextualCamera ? MemoryMode.camera : MemoryMode.browser;
    final current = visible.isEmpty ? null : visible[index.clamp(0, visible.length - 1)];
    return Column(
      children: [
        Row(
          children: [
            effectiveMode == MemoryMode.browser ? RoundButton(colors: colors, icon: Icons.mail_outline, onTap: showDms) : const SizedBox(width: 48),
            Expanded(child: Center(child: Text(widget.creatingPin ? 'Create pin' : addingMemory ? 'Add memory' : effectiveMode == MemoryMode.camera ? 'Camera' : 'Memories', style: TextStyle(color: colors.text, fontWeight: FontWeight.w900, fontSize: 17)))),
            effectiveMode == MemoryMode.browser ? RoundButton(colors: colors, icon: Icons.notifications_none, onTap: showNotifications) : const SizedBox(width: 48),
          ],
        ),
        const SizedBox(height: 24),
        if (effectiveMode == MemoryMode.camera)
          Expanded(
            child: CameraPanel(
              colors: colors,
              creatingPin: widget.creatingPin,
              addingMemoryToPin: widget.memoryTargetPin?.title,
              captured: widget.creatingPin && widget.pinMemoryCaptured,
              publicPin: widget.draftPublicPin,
              onCapture: widget.creatingPin ? widget.onCapturePinMemory : addingMemory ? widget.onCaptureExistingPinMemory : null,
              onToggleAudience: widget.onTogglePinAudience,
            ),
          )
        else
          Expanded(child: buildBrowser(colors, current)),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (contextualCamera)
              IconButton(onPressed: widget.onCancelPinCreation, icon: Icon(Icons.close, color: colors.text))
            else
              const SizedBox(width: 48),
            if (effectiveMode == MemoryMode.camera)
              widget.creatingPin && widget.pinMemoryCaptured
                  ? const SizedBox(width: 62, height: 62)
                  : GestureDetector(
                      onTap: addingMemory ? widget.onCaptureExistingPinMemory : widget.onCapturePinMemory,
                      child: Container(
                        width: 62,
                        height: 62,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: AppColors.yellow, width: 4),
                        ),
                      ),
                    )
            else
              Row(
                children: [
                  CircleButtonText(text: current?.reacted == true ? '✓' : reactions[reactionIndex], colors: colors, onTap: current?.reacted == true ? null : () => setState(() => reactionIndex = (reactionIndex + 1) % reactions.length)),
                  const SizedBox(width: 8),
                  TextButton(
                    style: TextButton.styleFrom(backgroundColor: colors.panel, foregroundColor: colors.text, shape: const StadiumBorder()),
                    onPressed: current == null || current.reacted ? null : () => setState(() {
                      current.reacted = true;
                      reactionIndex = 0;
                      if (current.friendStatus == FriendStatus.friends) widget.onReaction();
                    }),
                    child: Text(current?.reacted == true ? 'Reacted' : 'Send', style: const TextStyle(fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
            if (widget.creatingPin)
              widget.pinMemoryCaptured
                  ? IconButton(
                      onPressed: widget.onPublishPin,
                      icon: Icon(Icons.check_rounded, color: colors.text),
                    )
                  : const SizedBox(width: 48)
            else if (addingMemory)
              const SizedBox(width: 48)
            else
              IconButton(onPressed: showFriends, icon: Icon(Icons.group_outlined, color: effectiveMode == MemoryMode.browser ? colors.text : Colors.transparent)),
          ],
        ),
      ],
    );
  }

  Widget buildBrowser(AppThemeColors colors, MemoryItem? current) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: colors.panel, borderRadius: BorderRadius.circular(999)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Segment(text: 'Public', active: audience == MemoryAudience.public, colors: colors, onTap: () => setState(() { audience = MemoryAudience.public; index = 0; })),
              Segment(text: 'Friends', active: audience == MemoryAudience.friends, colors: colors, onTap: () => setState(() { audience = MemoryAudience.friends; index = 0; })),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Expanded(
          child: GestureDetector(
            onVerticalDragEnd: (details) {
              if (visible.length < 2) return;
              setState(() {
                if ((details.primaryVelocity ?? 0) < 0) index = (index + 1).clamp(0, visible.length - 1);
                if ((details.primaryVelocity ?? 0) > 0) index = (index - 1).clamp(0, visible.length - 1);
              });
            },
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(color: colors.panel, borderRadius: BorderRadius.circular(30)),
              child: Stack(
                children: [
                  if (current == null) Center(child: Text(audience == MemoryAudience.public ? 'No public memories' : 'No friend memories', style: TextStyle(color: colors.muted, fontWeight: FontWeight.w800))),
                  if (current != null) const Center(child: PhotoSilhouette()),
                  if (current != null && audience == MemoryAudience.public && current.friendStatus == FriendStatus.none)
                    Positioned(
                      right: 16,
                      top: 16,
                      child: TextButton(
                        style: TextButton.styleFrom(backgroundColor: AppColors.yellow, foregroundColor: AppColors.black, shape: const StadiumBorder()),
                        onPressed: () => setState(() {
                          current.friendStatus = FriendStatus.requested;
                          widget.onFriendChanged();
                        }),
                        child: const Text('Add friend', style: TextStyle(fontWeight: FontWeight.w900)),
                      ),
                    ),
                  if (current != null && current.friendStatus == FriendStatus.requested)
                    const Positioned(right: 16, top: 16, child: DarkPill(text: 'Requested')),
                  if (current != null && current.friendStatus == FriendStatus.friends)
                    Positioned(right: 16, top: 16, child: SmallIcon(icon: Icons.chat_bubble_outline, onTap: () => showDirectChat(current))),
                ],
              ),
            ),
          ),
        ),
        if (current != null) Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(current.owner, style: TextStyle(color: colors.text, fontWeight: FontWeight.w900)),
              const SizedBox(width: 8),
              Text(current.age, style: TextStyle(color: colors.muted)),
            ],
          ),
        ),
      ],
    );
  }

  void showDms() {
    final chats = [
      MemoryItem(id: 'nia-chat', owner: 'Nia', age: 'now', audience: MemoryAudience.friends, friendStatus: FriendStatus.friends),
      MemoryItem(id: 'amani-chat', owner: 'Amani', age: 'now', audience: MemoryAudience.friends, friendStatus: FriendStatus.friends),
    ];
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: widget.colors.panel,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => MessagesSheet(
        colors: widget.colors,
        chats: chats,
        onOpenChat: (friend) {
          Navigator.pop(context);
          showDirectChat(friend);
        },
      ),
    );
  }

  void showDirectChat(MemoryItem friend) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: widget.colors.panel,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => DirectChatSheet(colors: widget.colors, friend: friend),
    );
  }

  void showNotifications() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: widget.colors.panel,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => InfoSheet(colors: widget.colors, title: 'Activity', lines: const ['🔥 8 reactions', 'Friend request accepted', 'Streak updated']),
    );
  }

  void showFriends() {
    final friends = widget.memories.where((memory) => memory.friendStatus == FriendStatus.friends).toList();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: widget.colors.panel,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Friends', style: TextStyle(color: widget.colors.text, fontSize: 22, fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            ...friends.map((friend) => ListTile(
              leading: CircleAvatar(backgroundColor: AppColors.yellow, child: Text(friend.owner[0], style: const TextStyle(color: AppColors.black, fontWeight: FontWeight.w900))),
              title: Text(friend.owner, style: TextStyle(color: widget.colors.text, fontWeight: FontWeight.w800)),
              trailing: TextButton(onPressed: () => setState(() => friend.friendStatus = FriendStatus.none), child: const Text('Remove')),
            )),
          ],
        ),
      ),
    );
  }
}

class SettingsView extends StatelessWidget {
  const SettingsView({super.key, required this.colors, required this.lightMode, required this.onToggleTheme});
  final AppThemeColors colors;
  final bool lightMode;
  final VoidCallback onToggleTheme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('@nairobiuser', style: TextStyle(color: colors.muted, fontWeight: FontWeight.w800)),
        Text('Settings', style: TextStyle(color: colors.text, fontSize: 28, fontWeight: FontWeight.w900)),
        const SizedBox(height: 22),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.yellow, borderRadius: BorderRadius.circular(24)),
          child: Row(
            children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Appearance', style: TextStyle(color: AppColors.black, fontSize: 11, fontWeight: FontWeight.w800)),
                Text(lightMode ? 'Light mode' : 'Dark mode', style: const TextStyle(color: AppColors.black, fontSize: 18, fontWeight: FontWeight.w900)),
              ]),
              const Spacer(),
              TextButton(
                style: TextButton.styleFrom(backgroundColor: AppColors.black, foregroundColor: AppColors.white, shape: const StadiumBorder()),
                onPressed: onToggleTheme,
                child: Text(lightMode ? 'Dark mode' : 'Light mode'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        ...['Profile basics', 'Location permission', 'Notifications', 'Privacy', 'Blocked users', 'Report or help', 'Delete account'].map((item) => SettingsRow(colors: colors, label: item)),
        const Spacer(),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.orange, borderRadius: BorderRadius.circular(22)),
          child: const Text('Safety default\nNo live personal location is shown on public pins.', style: TextStyle(color: AppColors.black, height: 1.4)),
        ),
      ],
    );
  }
}

class BottomNav extends StatelessWidget {
  const BottomNav({super.key, required this.selected, required this.colors, required this.onSelect});
  final MainTab selected;
  final AppThemeColors colors;
  final ValueChanged<MainTab> onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 58,
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(color: colors.panel, borderRadius: BorderRadius.circular(28)),
      child: Row(
        children: MainTab.values.map((tab) {
          final active = tab == selected;
          final label = switch (tab) { MainTab.pins => 'Pins', MainTab.memories => 'Memories', MainTab.settings => 'Settings' };
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelect(tab),
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(color: active ? AppColors.yellow : Colors.transparent, borderRadius: BorderRadius.circular(24)),
                child: Text(label, style: TextStyle(color: active ? AppColors.black : colors.muted, fontWeight: FontWeight.w900)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class CreatePinSheet extends StatelessWidget {
  const CreatePinSheet({
    super.key,
    required this.colors,
    required this.publicPin,
    required this.memoryCaptured,
    required this.onToggleAudience,
    required this.onCapture,
    required this.onClose,
    required this.onCreate,
  });
  final AppThemeColors colors;
  final bool publicPin;
  final bool memoryCaptured;
  final VoidCallback onToggleAudience;
  final VoidCallback onCapture;
  final VoidCallback onClose;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black54,
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(color: colors.panel, borderRadius: const BorderRadius.vertical(top: Radius.circular(28))),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text('Create pin\nCapture what is happening', style: TextStyle(color: colors.text, fontSize: 20, fontWeight: FontWeight.w900))),
                IconButton(onPressed: onClose, icon: Icon(Icons.close, color: colors.text)),
              ]),
              const SizedBox(height: 12),
              Container(
                height: 220,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: colors.shell,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: memoryCaptured ? AppColors.yellow : colors.panel2, width: 2),
                ),
                child: Stack(
                  children: [
                    const Center(child: PhotoSilhouette()),
                    Center(
                      child: GestureDetector(
                        onTap: onCapture,
                        child: Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            color: memoryCaptured ? AppColors.yellow : Colors.transparent,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.yellow, width: 3),
                          ),
                          child: Icon(
                            memoryCaptured ? Icons.check_rounded : Icons.photo_camera_outlined,
                            color: memoryCaptured ? AppColors.black : AppColors.yellow,
                            size: 38,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 14,
                      child: Text(
                        memoryCaptured
                            ? 'Memory captured. Now add optional context.'
                            : 'Capture a memory first. The memory creates the pin.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: memoryCaptured ? AppColors.yellow : colors.muted, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AnimatedOpacity(
                opacity: memoryCaptured ? 1 : .35,
                duration: const Duration(milliseconds: 180),
                child: IgnorePointer(
                  ignoring: !memoryCaptured,
                  child: Column(
                    children: [
                      FakeInput(colors: colors, text: 'Title optional: New hangout'),
                      FakeInput(colors: colors, text: 'Area detected: Nairobi'),
                      FakeInput(colors: colors, text: 'Live now: expires after 24 hours'),
                      const SizedBox(height: 10),
                      Row(children: [
                        Expanded(child: Segment(text: 'Friends', active: !publicPin, colors: colors, onTap: publicPin ? onToggleAudience : () {})),
                        const SizedBox(width: 8),
                        Expanded(child: Segment(text: 'Public', active: publicPin, colors: colors, onTap: publicPin ? () {} : onToggleAudience)),
                      ]),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text('Friends is default. Public can be seen by everyone on Pin.', style: TextStyle(color: colors.muted, fontSize: 11)),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: memoryCaptured ? AppColors.yellow : colors.panel2,
                    foregroundColor: memoryCaptured ? AppColors.black : colors.muted,
                  ),
                  onPressed: memoryCaptured ? onCreate : null,
                  child: Text(memoryCaptured ? 'Publish pin with memory' : 'Capture memory first'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CameraPanel extends StatelessWidget {
  const CameraPanel({
    super.key,
    required this.colors,
    this.creatingPin = false,
    this.addingMemoryToPin,
    this.captured = false,
    this.publicPin = false,
    this.onCapture,
    this.onToggleAudience,
  });
  final AppThemeColors colors;
  final bool creatingPin;
  final String? addingMemoryToPin;
  final bool captured;
  final bool publicPin;
  final VoidCallback? onCapture;
  final VoidCallback? onToggleAudience;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(color: colors.panel, borderRadius: BorderRadius.circular(30)),
      child: Stack(
        children: [
          if (creatingPin)
            Positioned(
              top: 14,
              right: 14,
              child: MiniAudienceToggle(colors: colors, publicPin: publicPin, onToggleAudience: onToggleAudience ?? () {}),
            ),
          Center(
            child: GestureDetector(
              onTap: onCapture,
              child: Container(
                width: captured ? 132 : 150,
                height: captured ? 132 : 150,
                decoration: BoxDecoration(
                  color: captured ? AppColors.yellow.withValues(alpha: .12) : Colors.transparent,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.yellow, width: 3),
                ),
                child: Center(
                  child: Icon(captured ? Icons.check_rounded : Icons.camera_alt_outlined, color: AppColors.yellow, size: captured ? 72 : 58),
                ),
              ),
            ),
          ),
          Positioned(
            left: 26,
            right: 26,
            bottom: 54,
            child: captured && creatingPin
                ? const SizedBox.shrink()
                : Text(
                    addingMemoryToPin != null
                        ? 'Capture a memory for $addingMemoryToPin.'
                        : creatingPin ? 'Capture to create a pin.' : 'Tap capture to add a memory to your current pin.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: colors.muted),
                  ),
          ),
        ],
      ),
    );
  }
}

class MiniAudienceToggle extends StatelessWidget {
  const MiniAudienceToggle({super.key, required this.colors, required this.publicPin, required this.onToggleAudience});
  final AppThemeColors colors;
  final bool publicPin;
  final VoidCallback onToggleAudience;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(color: colors.panel2, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          MiniAudienceOption(text: 'Friends', active: !publicPin, onTap: publicPin ? onToggleAudience : () {}),
          MiniAudienceOption(text: 'Public', active: publicPin, onTap: publicPin ? () {} : onToggleAudience),
        ],
      ),
    );
  }
}

class MiniAudienceOption extends StatelessWidget {
  const MiniAudienceOption({super.key, required this.text, required this.active, required this.onTap});
  final String text;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(color: active ? AppColors.yellow : Colors.transparent, borderRadius: BorderRadius.circular(999)),
        child: Text(text, style: TextStyle(color: active ? AppColors.black : AppColors.muted, fontSize: 11, fontWeight: FontWeight.w900)),
      ),
    );
  }
}

class PinDraftDetailsPanel extends StatelessWidget {
  const PinDraftDetailsPanel({super.key, required this.colors, required this.publicPin, required this.onToggleAudience});
  final AppThemeColors colors;
  final bool publicPin;
  final VoidCallback onToggleAudience;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Who can see this pin?', textAlign: TextAlign.center, style: TextStyle(color: colors.text, fontWeight: FontWeight.w900, fontSize: 15)),
        const SizedBox(height: 6),
        Text('Pins are live now and disappear after 24 hours.', textAlign: TextAlign.center, style: TextStyle(color: colors.muted, fontSize: 11, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: colors.panel2, borderRadius: BorderRadius.circular(999)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
          children: [
              Segment(text: 'Friends', active: !publicPin, colors: colors, onTap: publicPin ? onToggleAudience : () {}),
              Segment(text: 'Public', active: publicPin, colors: colors, onTap: publicPin ? () {} : onToggleAudience),
          ],
          ),
        ),
        const SizedBox(height: 10),
        Text(publicPin ? 'Anyone on Pin can discover and add memories.' : 'Only accepted friends can see and add memories.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.yellow, fontSize: 11, fontWeight: FontWeight.w800)),
      ],
    );
  }
}

class DraftChoice extends StatelessWidget {
  const DraftChoice({super.key, required this.text, required this.colors, required this.active, this.onTap});
  final String text;
  final AppThemeColors colors;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.yellow : colors.panel2,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(text, style: TextStyle(color: active ? AppColors.black : colors.text, fontWeight: FontWeight.w900, fontSize: 12)),
      ),
    );
  }
}

class PhotoSilhouette extends StatelessWidget {
  const PhotoSilhouette({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(width: 118, height: 128, decoration: BoxDecoration(color: Colors.black.withValues(alpha: .55), borderRadius: BorderRadius.circular(52))),
        Positioned(top: 75, child: Container(width: 54, height: 74, decoration: BoxDecoration(color: Colors.black.withValues(alpha: .35), borderRadius: BorderRadius.circular(12)))),
      ],
    );
  }
}

class SettingsRow extends StatelessWidget {
  const SettingsRow({super.key, required this.colors, required this.label});
  final AppThemeColors colors;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      decoration: BoxDecoration(color: colors.panel, borderRadius: BorderRadius.circular(18)),
      child: Row(children: [Text(label, style: TextStyle(color: colors.text)), const Spacer(), Text('Open', style: TextStyle(color: colors.muted, fontSize: 12, fontWeight: FontWeight.w800))]),
    );
  }
}

class InfoSheet extends StatelessWidget {
  const InfoSheet({super.key, required this.colors, required this.title, required this.lines});
  final AppThemeColors colors;
  final String title;
  final List<String> lines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: colors.text, fontSize: 22, fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          ...lines.map((line) => ListTile(title: Text(line, style: TextStyle(color: colors.text)))),
        ],
      ),
    );
  }
}

class MessagesSheet extends StatelessWidget {
  const MessagesSheet({super.key, required this.colors, required this.chats, required this.onOpenChat});
  final AppThemeColors colors;
  final List<MemoryItem> chats;
  final ValueChanged<MemoryItem> onOpenChat;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Messages', style: TextStyle(color: colors.text, fontSize: 22, fontWeight: FontWeight.w900)),
          const SizedBox(height: 18),
          ...chats.map((chat) {
            final preview = chat.owner == 'Nia' ? 'Pulling up?' : 'See you there';
            return ListTile(
              contentPadding: EdgeInsets.zero,
              onTap: () => onOpenChat(chat),
              leading: CircleAvatar(
                backgroundColor: AppColors.yellow,
                child: Text(chat.owner[0], style: const TextStyle(color: AppColors.black, fontWeight: FontWeight.w900)),
              ),
              title: Text(chat.owner, style: TextStyle(color: colors.text, fontWeight: FontWeight.w900)),
              subtitle: Text(preview, style: TextStyle(color: colors.muted, fontWeight: FontWeight.w700)),
              trailing: Icon(Icons.chevron_right, color: colors.muted),
            );
          }),
        ],
      ),
    );
  }
}

class DirectChatSheet extends StatelessWidget {
  const DirectChatSheet({super.key, required this.colors, required this.friend});
  final AppThemeColors colors;
  final MemoryItem friend;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(18, 14, 18, 18 + MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: 360,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.yellow,
                  child: Text(friend.owner[0], style: const TextStyle(color: AppColors.black, fontWeight: FontWeight.w900)),
                ),
                const SizedBox(width: 10),
                Text(friend.owner, style: TextStyle(color: colors.text, fontSize: 20, fontWeight: FontWeight.w900)),
                const Spacer(),
                IconButton(onPressed: () => Navigator.pop(context), icon: Icon(Icons.close, color: colors.text)),
              ],
            ),
            const SizedBox(height: 18),
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 230),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(color: colors.panel2, borderRadius: BorderRadius.circular(18)),
                child: Text('Pulling up?', style: TextStyle(color: colors.text, fontWeight: FontWeight.w700)),
              ),
            ),
            const Spacer(),
            Row(
              children: [
                IconButton(onPressed: () {}, icon: Icon(Icons.emoji_emotions_outlined, color: colors.text)),
                Expanded(
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    alignment: Alignment.centerLeft,
                    decoration: BoxDecoration(color: colors.shell, borderRadius: BorderRadius.circular(999), border: Border.all(color: colors.muted.withValues(alpha: .25))),
                    child: Text('Message ${friend.owner}', style: TextStyle(color: colors.muted, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(color: AppColors.yellow, shape: BoxShape.circle),
                  child: const Icon(Icons.send_rounded, color: AppColors.black, size: 20),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class RoundButton extends StatelessWidget {
  const RoundButton({super.key, required this.colors, required this.icon, required this.onTap});
  final AppThemeColors colors;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(width: 48, height: 48, decoration: BoxDecoration(color: colors.panel, shape: BoxShape.circle), child: Icon(icon, color: colors.text)),
    );
  }
}

class ChipPill extends StatelessWidget {
  const ChipPill({super.key, required this.text, required this.active, required this.colors});
  final String text;
  final bool active;
  final AppThemeColors colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
      decoration: BoxDecoration(color: active ? AppColors.yellow : colors.panel, borderRadius: BorderRadius.circular(999)),
      child: Text(text, style: TextStyle(color: active ? AppColors.black : colors.text, fontWeight: FontWeight.w900)),
    );
  }
}

class Segment extends StatelessWidget {
  const Segment({super.key, required this.text, required this.active, required this.colors, required this.onTap});
  final String text;
  final bool active;
  final AppThemeColors colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 9),
        decoration: BoxDecoration(color: active ? AppColors.yellow : Colors.transparent, borderRadius: BorderRadius.circular(999)),
        alignment: Alignment.center,
        child: Text(text, style: TextStyle(color: active ? AppColors.black : colors.muted, fontWeight: FontWeight.w900)),
      ),
    );
  }
}

class AreaLabel extends StatelessWidget {
  const AreaLabel({super.key, required this.text, required this.colors});
  final String text;
  final AppThemeColors colors;
  @override
  Widget build(BuildContext context) => DarkPill(text: text, background: colors.panel2, foreground: colors.text);
}

class DarkPill extends StatelessWidget {
  const DarkPill({super.key, required this.text, this.background = const Color(0xAA000000), this.foreground = AppColors.white});
  final String text;
  final Color background;
  final Color foreground;
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)), child: Text(text, style: TextStyle(color: foreground, fontSize: 10, fontWeight: FontWeight.w900)));
}

class DangerPill extends StatelessWidget {
  const DangerPill({super.key, required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: AppColors.red, borderRadius: BorderRadius.circular(999)), child: Text(text, style: const TextStyle(color: AppColors.white, fontSize: 10, fontWeight: FontWeight.w900)));
}

class SmallAction extends StatelessWidget {
  const SmallAction({super.key, required this.label, required this.onTap, this.active = false});
  final String label;
  final VoidCallback onTap;
  final bool active;
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(color: active ? AppColors.yellow : Colors.black54, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(color: active ? AppColors.black : AppColors.white, fontSize: 9, fontWeight: FontWeight.w900)),
    ),
  );
}

class SmallIcon extends StatelessWidget {
  const SmallIcon({super.key, required this.icon, required this.onTap, this.color = Colors.black54});
  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  @override
  Widget build(BuildContext context) => GestureDetector(onTap: onTap, child: Container(width: 30, height: 30, margin: const EdgeInsets.only(left: 5), decoration: BoxDecoration(color: color, shape: BoxShape.circle), child: Icon(icon, color: color == AppColors.orange ? AppColors.black : AppColors.white, size: 16)));
}

class CircleButtonText extends StatelessWidget {
  const CircleButtonText({super.key, required this.text, required this.colors, required this.onTap});
  final String text;
  final AppThemeColors colors;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(onTap: onTap, child: Container(width: 44, height: 44, decoration: BoxDecoration(color: colors.panel, shape: BoxShape.circle), alignment: Alignment.center, child: Text(text, style: TextStyle(color: colors.text, fontSize: 18))));
}

class FakeInput extends StatelessWidget {
  const FakeInput({super.key, required this.colors, required this.text});
  final AppThemeColors colors;
  final String text;
  @override
  Widget build(BuildContext context) => Container(width: double.infinity, margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14), decoration: BoxDecoration(border: Border.all(color: colors.muted.withValues(alpha: .35)), borderRadius: BorderRadius.circular(16)), child: Text(text, style: TextStyle(color: colors.muted)));
}
