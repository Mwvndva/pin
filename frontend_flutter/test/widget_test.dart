import 'package:flutter_test/flutter_test.dart';
import 'package:pin_flutter/main.dart';

void main() {
  testWidgets('Pin app opens on the Pins screen', (tester) async {
    await tester.pumpWidget(const PinApp());

    expect(find.text('Pins'), findsOneWidget);
    expect(find.text('Memories'), findsOneWidget);
    expect(find.text('Settings'), findsOneWidget);
  });
}
